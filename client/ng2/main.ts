import { bootstrap } from '@angular/platform-browser-dynamic';
import { Component } from '@angular/core';
import { Http, HTTP_PROVIDERS } from '@angular/http';

// From Underscore
function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function movieId(imdb_id): string {
  if (imdb_id.toString().charAt(0) === 't') imdb_id = imdb_id.substr(2);
  return parseInt(imdb_id).toString();
}

function encodedMovieTitle(title): string {
  return encodeURIComponent(title.toLowerCase()).replace(/%20/g, '+');
}

function searchUrl(imdb_id, title): string {
  return `?id=${movieId(imdb_id)}&movie=${encodedMovieTitle(title)}`;
}

@Component({
  selector: 'taglines',
  template: `
    <div [ngClass]="taglineClass(0)"><span>Enter a <em>movie name</em> to get started</span></div>
    <div [ngClass]="taglineClass(1)"><span>Movies &amp; Chill</span> <span>creates a movie's <em>emotional fingerprint</em></span> <span>to find movies that feel the same</span></div>
    <div [ngClass]="taglineClass(2)"><span>The final answer for</span> <span><em>What do we watch tonight?</em></span></div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
class TaglinesComponent {
  tagIndex: number = 0;
  tagLengths: number[] = [33, 88, 46];  // hardcoded lengths for now

  ngAfterViewInit() {
    setTimeout(this.nextTagline.bind(this), 3500 + 80 * this.tagLengths[0]);
  }
  
  nextTagline(): void {
    this.tagIndex = (this.tagIndex + 1) % this.tagLengths.length;
    setTimeout(this.nextTagline.bind(this), 2000 + 80 * this.tagLengths[this.tagIndex]);
  }

  taglineClass(index): string {
    if (index === this.tagIndex) return 'tagline-fadein';
    return 'tagline-fadeout';
  }
}

@Component({
  selector: 'movie-search',
  inputs: ['movie'],
  template: `
    <form id="search-form" action="" method="get">
      <div id="label"><span>Show me <em class="em-movies">movies</em></span> <span>that <em class="em-feel">feel</em> like</span></div>
      <div id="search-box">
        <div (click)="handleSubmit()" id="mag">{{ '\ud83d\udd0d' }}</div>
        <div [style.display]="isFocused && completions.length ? 'block' : 'none'" id="autocomplete">
          <div *ngFor="let movie of completions; #i = index" (mousedown)="handleMouseDown(movie.id, movie.title)" (click)="handleClick(movie.id, movie.title)" [class.autocomplete-selected]="i === selectedIndex">
            <div>{{ movie.title }} ({{ movie.year }})</div>
            <div>{{ movie.cast.split(', ').slice(0, 3).join(', ') }}</div>
          </div>
        </div>
      </div>
      <input (keyup)="autocomplete()" (keydown)="handleKeyDown($event)" (focus)="isFocused = true" (blur)="isFocused = false" [(ngModel)]="movieName" autofocus="{{ !results.length }}" type="text" name="movie" id="movie-name" placeholder="Movie Name" autocomplete="off">
    </form>
    <taglines id="taglines"></taglines>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  viewProviders: [HTTP_PROVIDERS],
  directives: [TaglinesComponent]
})
class MovieSearchComponent {
  results: any[] = results;
  movieName: string = results.length ? results[0].title : '';
  lastCompletedName: string = '';
  completions: any[] = [];
  selectedIndex: number = -1;
  isFocused: boolean;

  constructor(public http: Http) {}

  autocomplete = debounce(() => {
    if (this.movieName === this.lastCompletedName) return;
    if (this.movieName.length < 4) {
      this.completions = [];
      this.selectedIndex = -1;
      return;
    }

    this.http.get('http://movieschill.com:8080/search?q=' + encodeURIComponent(this.movieName)).subscribe(res => {
      this.lastCompletedName = this.movieName;
      this.completions = res.json().filter(obj => !!obj);
      this.selectedIndex = this.completions.length ? 0 : -1;
    });
  }, 500)

  handleSubmit(): void {
    document.forms['search-form'].submit();
  }  

  handleKeyDown(event): void {
    if (!this.completions.length) return;

    switch (event.keycode || event.which) {
    case 38:
      event.preventDefault();
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
      break;
    case 40:
      event.preventDefault();
      this.selectedIndex = Math.min(this.completions.length - 1, this.selectedIndex + 1);
      break;
    case 13:
      event.preventDefault();
      let movie = this.completions[this.selectedIndex];
      window.location = searchUrl(movie.id, movie.title);
    }
  }

  handleMouseDown(id, title): void {  // need because non-touch click causes blur first
    this.handleClick(id, title);
  }

  handleClick(id, title): void {
    window.location = searchUrl(id, title);
  }
}

@Component({
  selector: 'rt-scores',
  inputs: ['movie'],
  host: {
    class: 'rt-container'
  },
  template: `
    <div *ngIf="movie.rt_critics_meter !== null || movie.rt_users_meter !== null" class="rt-attribution">
      <a href="{{ movie.rt_url }}" target="_blank">Rotten Tomatoes&reg; Score<span *ngIf="movie.rt_critics_meter !== null && movie.rt_users_meter !== null">s</span></a>
    </div>
    <div *ngIf="movie.rt_critics_meter || movie.rt_critics_meter === 0" [class.rt-critics-fresh]="movie.rt_critics_meter >= 60" [class.rt-critics-rotten]="movie.rt_critics_meter !== null && movie.rt_critics_meter < 60" class="rt-fresh-rotten rt-critics">
      <a href="{{ movie.rt_url }}" target="_blank">{{ movie.rt_critics_meter / 100 | percent }}</a>
    </div>
    <div *ngIf="movie.rt_users_meter || movie.rt_users_meter === 0" [class.rt-audience-fresh]="movie.rt_users_meter >= 60" [class.rt-audience-rotten]="movie.rt_users_meter !== null && movie.rt_users_meter < 60" class="rt-fresh-rotten rt-audience">
      <a href="{{ movie.rt_url }}" target="_blank">{{ movie.rt_users_meter / 100 | percent }}</a>
    </div>
  `
})
class RTScoresComponent {
  movie: any;
}

@Component({
  selector: 'imdb-stars',
  inputs: ['movie'],
  host: {
    class: 'imdb-container imdb-hide'
  },
  template: `
    <span *ngFor="let i of starMap()" class="imdb-star imdb-star-gray"></span>
    <span class="imdb-score">{{ movie.imdb_rating / 10 | number:'.1' }}</span> <span class="imdb-logo"><span>IMDb</span></span>
    <div [style.width.rem]="ratingWidth()" class="imdb-rating-container">
      <div class="imdb-rating">
        <span *ngFor="let i of starMap()" class="imdb-star imdb-star-gold"></span>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
class IMDbStarsComponent {
  movie: any;

  starMap(): number[] {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  }

  ratingWidth(): number {
    let imdb_rating: number = this.movie.imdb_rating;
    let starBox: number     = (window.innerWidth > 560) ? 0.8125 : 0.8;
    let starPadding: number = 2 * starBox / 13;
    let starWidth: number   = starBox - 2 * starPadding;
    let origin: number      = 0.4 * starBox / 13;
    let score: number       = imdb_rating / 10;
    let scoreFloor: number  = Math.floor(score);
    let remainder: number   = score - scoreFloor;

    return origin + starBox * scoreFloor + (remainder ? starPadding : 0) + remainder * starWidth;
  }
}

@Component({
  selector: 'movie',
  inputs: ['movie'],
  template: `
    <div class="result-left">
      <div [ngStyle]="{'background-image': 'url(http://img.omdbapi.com/?i=' + movie.imdb_id + '&apikey=dc53ea2e)'}" class="poster">
        <div class="runtime">{{ runtime() }}</div>
      </div>
      <rt-scores [movie]="movie" class="rt-container-left"></rt-scores>
    </div>
    <div class="result-right">
      <rt-scores [movie]="movie" class="rt-container-right"></rt-scores>
      <div *ngIf="movie.title" class="movie-title">
        <a href="searchUrl()">{{ movie.title }} ({{ movie.year }})</a>
      </div>
      <div class="rating-genres">
        <span *ngIf="movie.mpaa_rating">{{ movie.mpaa_rating }}<strong>&nbsp;&middot;&nbsp;</strong></span>{{ movie.genre }}
      </div>
      <imdb-stars [movie]="movie" [class.imdb-show]="movie.imdb_rating"></imdb-stars>
      <div class="plot-short">{{ movie.plot_short }}</div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  directives: [RTScoresComponent, IMDbStarsComponent]
})
class MovieComponent {
  movie: any;

  runtime(): string {
    let h: number = Math.floor(this.movie.runtime / 60);
    let m: number = this.movie.runtime % 60;
    return (h || '0') + ':' + ((m < 10) ? '0' : '') + m;
  }

  searchUrl(): string {
    return searchUrl(this.movie.imdb_id, this.movie.title);
  }
}

@Component({
  selector: 'back-to-top',
  template: `<span (click)="backToTop()" *ngIf="results.length">Back to Top</span>`,
  styles: [`
    :host {
      display: block;
    }
  `]
})
class BackToTopComponent {
  results: any[] = results;

  backToTop(): boolean {
    let timer = setInterval(() => {
      if (document.body.scrollTop > 0) {
        document.body.scrollTop = Math.max(0, document.body.scrollTop - 80);
      } else {
        clearInterval(timer);
      }
    }, 8);
    return false;
  }
}

@Component({
  selector: 'chill-app',
  template: `
    <div id="logo"><a href="/">movies</a><span><a href="/">&amp;</a></span><a href="/">chill</a></div>
    <movie-search id="search-container"></movie-search>
    <movie *ngFor="let movie of results" [movie]="movie" class="result"></movie>
    <back-to-top id="back-to-top"></back-to-top>
    <div id="footer-spacer"></div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  directives: [MovieSearchComponent, MovieComponent, BackToTopComponent]
})
class ChillApp {
  results: any[] = results;
}

bootstrap(ChillApp);