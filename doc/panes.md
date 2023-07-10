# Extension 'panes'
Let stylesheets add panes

## Example
```yaml
panes:
  casing:
    zIndex: 399
```

Creates a pane 'casing', with a CSS zIndex of 399.

More on panes: https://leafletjs.com/reference.html#map-pane

## Using Twig
Alternatively, if 'panes' is a string, a Twig template is expected, that evaluates into a YAML document. If the stylesheet has a 'const' section, this will be available to the Twig template:
```yaml
panes: |
  {% for i in [1, 2, 3] %}
  casing{{ i }}:
    zIndex: {{ 397 + i }}
  {% endfor %}
```
