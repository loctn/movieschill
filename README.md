Movies & Chill
==============

Movies & Chill is a movie recommender that works by comparing movie review sentiment. It tries to get several "how I want to feel" outputs from one "what I have watched" input. The main algorithm was a 24-hour project as an entry to the 2016 [Valley Hackathon](http://valleyhackathon.com/) where it took the Participants' Choice Award. The [demo website](http://movieschill.com) and its code here are provided AS IS for historical purposes, and there are no plans to maintain this project.

I wanted to do something like analyze film scripts or trailer audio to extract mood information. Even though those sound like very cool projects, sentiment analysis on user reviews is both easier and has the added benefit that by definition a review has already taken an input movie and output an emotional interpretation.

Under hackathon constraints with a single-person team it was necessary to reduce the scope of the problem, so instead of a fancy machine learning approach I opted to treat the review corpora (Rotten Tomatoes and IMDb user reviews) as a [bag of words](https://en.wikipedia.org/wiki/Bag-of-words_model). There are some drawbacks to this approach:

- we don't account for the sense in which a word is used;
- we don't account for word frequency by user vocabulary and conventional english usage; and
- we don't account for bias in the expression of a movie's meta information (title, actors, etc.) rather than its content.

Plenty more methodoligcal challenges exist with the chosen approach, but the idea is that with enough data some of the "errors" would diminish. The [demo website](http://movieschill.com) represents four passes over each movie where data is available, and shows that even a small sample can produce useful results.

Since I also wanted to avoid coming up with my own emotional model, I delegated that to the [Plutchik wheel](https://en.wikipedia.org/wiki/File:Plutchik-wheel.svg). The word lists in `scraper/commander/words/` are mapped to each of the Plutchik flower's 24 subpetals and scored by the criteria in `scraper/commander/scorer.js`. The recommender client returns a query by closest distance with respect to the 24-dimensional space.

License
-------

[CC0](https://creativecommons.org/publicdomain/zero/1.0/)