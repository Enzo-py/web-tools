# web-tools
Some tools for web development (client side)

## see demo
```bash
python -m http.server 8000
```
then open http://localhost:8000/demo/ in your browser

## Use it
To use it, just use the bundle `toolbox.bundle.js` in your HTML:
```html
<script src="toolbox.bundle.js"></script>
```
This will create a global `Toolbox` object with all the tools.

Download the folder `public` and put it on your server.




### create bundle
```bash
npx esbuild js/toolbox/index.js \           
  --bundle --format=iife --global-name=Toolbox \
  --outdir=public --entry-names=toolbox.bundle \
  --loader:.css=text \
  --sourcemap --minify
```