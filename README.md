# web-tools
Some tools for web development (client side)

## see demo
```bash
python -m http.server 8000
```
then open http://localhost:8000/demo/ in your browser


# create bundle
```bash
npx esbuild js/toolbox/index.js \           
  --bundle --format=iife --global-name=Toolbox \
  --outdir=public --entry-names=toolbox.bundle \
  --loader:.css=text \
  --sourcemap --minify
```