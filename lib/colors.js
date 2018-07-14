'use strict';

const STYLES = {
  bold: 1,
  dark: 2,
  italic: 3,
  underscored: 4,
  blink: 5,
  reversed: 7,
  concealed: 8
};

const COLORS = {
  black: [30, 40],
  red: [31, 41],
  green: [32, 42],
  yellow: [33, 43],
  blue: [34, 44],
  magenta: [35, 45],
  cyan: [36, 46],
  white: [37, 47]
};

const colorify = attributes => {
  let [style, foreground, background] = attributes.split(',');

  style = STYLES[style];

  foreground = foreground in COLORS
    ? COLORS[foreground][0]
    : null;

  background = background in COLORS
    ? COLORS[background][1]
    : null;

  attributes = [
    style,
    foreground,
    background
  ].filter(item => !!item);

  const header = '\x1b[' + attributes.join(';') + 'm';
  const end = '\x1b[0m';

  const result = text => header + text + end;
  result.log = text => (
    process.stdout.write(header),
    console.log(text),
    process.stdout.write(end)
  );

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

okra.colorify = colorify;
