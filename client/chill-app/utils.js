function movieId(imdb_id) {
  imdb_id = '' + imdb_id;
  if (imdb_id[0] === 't') {
    imdb_id = imdb_id.substr(2);
  }
  return '' + parseInt(imdb_id);
}

function encodedMovieTitle(title) {
  return encodeURIComponent(title.toLowerCase()).replace(/%20/g, '+');
}

export function searchUrl(imdb_id, title) {
  return `?id=${movieId(imdb_id)}&movie=${encodedMovieTitle(title)}`;
}

// From Underscore
export function debounce(fn, wait, immediate) {
  let timeout;
  return function() {
    let ctx  = this;
    let args = arguments;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) {
        fn.apply(ctx, args);
      }
    }, wait);

    if (immediate && !timeout) {
      fn.apply(ctx, args);
    }
  };
}