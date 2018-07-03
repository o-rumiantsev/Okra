'use strict';

const STYLES = {
  bold:        1,
  dark:        2,
  italic:      3,
  underscored: 4,
  blink:       5,
  reversed:    7,
  concealed:   8
};

const COLORS = {
  black:   [30, 40],
  red:     [31, 41],
  green:   [32, 42],
  yellow:  [33, 43],
  blue:    [34, 44],
  magenta: [35, 45],
  cyan:    [36, 46],
  white:   [37, 47]
};

const colorify = attributes => {
  let [style, foreground, background] = attributes.split(',');

  style in STYLES ?
    style = STYLES[style] :
    style = null;

  foreground in COLORS ?
    foreground = COLORS[foreground][0] :
    foreground = null;

  background in COLORS ?
    background = COLORS[background][1] :
    background = null;

  attributes = [
    style,
    foreground,
    background
  ].filter(item => !!item);

  const result = text =>
    '\x1b[' + attributes.join(';') + 'm' + text + '\x1b[0m'

  result.log = text => console.log(result(text));

  return result;
};

const specialColors = {
  info: colorify('bold,green'),
  error: colorify('bold,red'),
  warning: colorify('bold,yellow'),
  debug: colorify('bold,cyan')
};

specialColors.success = specialColors.info;
specialColors.fail = specialColors.error;

Object.assign(colorify, specialColors);

module.exports = colorify;
