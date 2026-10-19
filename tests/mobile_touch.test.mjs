import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../src/body.html', import.meta.url), 'utf8');
const stage = css.match(/\.stage\{([^}]*)\}/)?.[1];
const atom = css.match(/\.stage-atom\{([^}]*)\}/)?.[1];
assert.ok(stage, 'The molecular stage CSS selector must exist');
assert.ok(atom, 'The atom CSS selector must exist');
assert.match(stage, /(?:^|;)touch-action:auto(?:;|$)/, 'Empty stage must delegate touch gestures to the browser');
assert.match(css, /\.stage:before\{[^}]*pointer-events:none(?:;|$)/, 'Decoration must not intercept touch');
assert.match(atom, /(?:^|;)touch-action:none(?:;|$)/, 'Dragging an atom must retain pointer movement on touch devices');
assert.match(html, /مرّر الصفحة من فراغ المختبر/, 'Explain gesture boundaries to mobile users');
assert.match(html, /class="stage-release"[^>]*>v0\.3\.0<\/span>/, 'Show deployed version in mobile editor');
console.log('PASS: editor blank area permits native vertical scrolling while atoms retain touch drag');
