<?php

/*
ini_set('display_startup_errors', 1);
ini_set('display_errors', 1);
error_reporting(-1);
*/

define('TABLE', 'movies');
define('RESULT_COUNT', 15);

$results = array();

if (!empty($_GET['movie']) || !empty($_GET['id'])) {
  $mysqli = new mysqli("127.0.0.1", "redacted", "redacted", "redacted");

  if (mysqli_connect_errno()) {
    printf("Connect failed: %s\n", mysqli_connect_error());
    exit();
  }

  $mysqli->query("SET character_set_client='utf8', character_set_results='utf8', collation_connection='utf8_general_ci'");

  if (!empty($_GET['id'])) {
    $id = preg_replace('/[^0-9]/i', '', $_GET['id']);
    $select = "imdb_id = 'tt" . substr('0000000', 0, 7 - min(7, strlen($id))) . $id . "'";
  } else {
    $select = "(word_count_d > 0 OR word_count_p_i > 0 OR word_count_p_r > 0) AND title LIKE '%" . $mysqli->real_escape_string($_GET['movie']) . "%' ORDER BY imdb_votes DESC";
  }
  
  $query = 
    "SELECT title, year, " . 
      "c00, c01, c02, " .
      "c10, c11, c12, " .
      "c20, c21, c22, " .
      "c30, c31, c32, " .
      "c40, c41, c42, " .
      "c50, c51, c52, " .
      "c60, c61, c62, " .
      "c70, c71, c72 " .
    "FROM " . TABLE . " WHERE $select LIMIT 1";

  if ($stmt = $mysqli->prepare($query)) {
    $stmt->execute();
    $stmt->store_result();
    $num_rows = $stmt->num_rows;
    $stmt->bind_result($title_source, $year_source,
      $c00, $c01, $c02,
      $c10, $c11, $c12,
      $c20, $c21, $c22,
      $c30, $c31, $c32,
      $c40, $c41, $c42,
      $c50, $c51, $c52,
      $c60, $c61, $c62,
      $c70, $c71, $c72
      );
    $stmt->fetch();
    $stmt->close();

    if ($num_rows == 1) {
      $query =
        "SELECT imdb_id, title, year, mpaa_rating, runtime, genre, plot_short, imdb_rating, rt_critics_meter, rt_users_meter, rt_url, " .
          "(" .
            "POWER(c00 - $c00, 2) + POWER(c01 - $c01, 2) + POWER(c02 - $c02, 2) + " .
            "POWER(c10 - $c10, 2) + POWER(c11 - $c11, 2) + POWER(c12 - $c12, 2) + " .
            "POWER(c20 - $c20, 2) + POWER(c21 - $c21, 2) + POWER(c22 - $c22, 2) + " .
            "POWER(c30 - $c30, 2) + POWER(c31 - $c31, 2) + POWER(c32 - $c32, 2) + " .
            "POWER(c40 - $c40, 2) + POWER(c41 - $c41, 2) + POWER(c42 - $c42, 2) + " .
            "POWER(c50 - $c50, 2) + POWER(c51 - $c51, 2) + POWER(c52 - $c52, 2) + " .
            "POWER(c60 - $c60, 2) + POWER(c61 - $c61, 2) + POWER(c62 - $c62, 2) + " .
            "POWER(c70 - $c70, 2) + POWER(c71 - $c71, 2) + POWER(c72 - $c72, 2)" .
          ") AS subpetal_distance " .
        "FROM " . TABLE . " ORDER BY subpetal_distance LIMIT " . (RESULT_COUNT + 1);

      if ($stmt = $mysqli->prepare($query)) {
        $stmt->execute();
        
        $stmt->bind_result($imdb_id, $title, $year, $mpaa_rating, $runtime, $genre, $plot_short, $imdb_rating, $rt_critics_meter, $rt_users_meter, $rt_url, $subpetal_distance);

        while ($stmt->fetch()) {
          $results[] = array_combine(
            array('imdb_id', 'title', 'year', 'mpaa_rating', 'runtime', 'genre', 'plot_short', 'imdb_rating', 'rt_critics_meter', 'rt_users_meter', 'rt_url'),
            array($imdb_id , $title , $year , $mpaa_rating , $runtime , $genre , $plot_short , $imdb_rating , $rt_critics_meter , $rt_users_meter , $rt_url )
            );
        }

        $stmt->close();
      }
    }
  }

  $mysqli->close();
}

?>
<!doctype html>
<html>

<head>

<title>Movies &amp; Chill</title>
<meta name="viewport" content="initial-scale=1">
<meta charset="utf-8">

<meta content="Movies &amp; Chill" property="og:title">
<meta content="http://movieschill.com/" property="og:url">
<meta content="1572457866411814" property='fb:app_id'/>
<meta content="Movies &amp; Chill" property="og:site_name">
<meta content="Movies &amp; Chill creates a movie's emotional fingerprint to find movies that feel the same" property="og:description">
<meta content="http://movieschill.com/thumbnail1.png" property="og:image">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@movieschill">
<meta name="twitter:creator" content="@movieschill">
<meta name="twitter:title" content="Movies &amp; Chill">
<meta name="twitter:description" content="Movies &amp; Chill creates a movie's emotional fingerprint to find movies that feel the same">
<meta name="twitter:image" content="http://movieschill.com/thumbnail1.png">

<link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAe1BMVEUAAAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AAD/AABsiJVxAAAAKHRSTlMA0fvt8d9+Z/WQXCwpIRoW9ui1pJyHhoJrNDAk5dfHrJZ5c29VTBEHbHpd6gAAAI1JREFUGNNVj1cSgzAMRCUXeocEAul173/CuAxNP959HmklshVyVLcpLXWAYBZVMfsJ8kSUDr8ZJDh6sYJ4D3Khpj0JwH7gmoJLvvE9+AadLT6DzKlDPZpoRx8uNTbLfBWTk6GffG5wt+qFzh8EyNKKQmEwT9kDInFfbwHdXCPoIPLdNLa6UhyU9JFP+gPgOQkLmKqArwAAAABJRU5ErkJggg==">
<link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=NTR|Raleway|Open+Sans:400,600">
<link rel="stylesheet" type="text/css" href="main.css">

<script src="node_modules/es6-shim/es6-shim.min.js"></script>
<script src="node_modules/zone.js/dist/zone.js"></script>
<script src="node_modules/reflect-metadata/Reflect.js"></script>
<script src="node_modules/systemjs/dist/system.src.js"></script>
<script src="systemjs.config.js"></script>

<script><?php echo "var results = " . json_encode($results) . ";"; ?></script>

<script>

System.import('main.js').catch(function(err) { console.error(err); });

</script>

</head>

<body>

<chill-app id="container"></chill-app>
<div id="footer">
  <a href="http://locwin.com">&copy; Loc Nguyen</a>
</div>

<script>
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-62515741-3', 'auto');
ga('send', 'pageview');
</script>

</body>

</html>