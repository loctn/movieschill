require('file?name=[name].[ext]!./index.php');

import React from 'react';
import { render } from 'react-dom';

import ChillApp from './chill-app';

render(
  <ChillApp />,
  document.getElementById('content')
);