# Cookbook

## Launch a Tee From a Prompt

```text
/vaybel:launch-product "distressed motocross type treatment, washed black tee"
```

The skill will search for a tee blank, generate a design, create flat mockups,
and return a concise launch summary.

## Launch on a Specific Product

```text
/vaybel:launch-product "glacial trail map fragments and tiny elevation labels" --product <product-uuid>
```

Use a catalog product UUID from Vaybel MCP `catalog.list_blanks`.

## Force AOP

```text
/vaybel:launch-product "all-over checkerboard field with tiny road-race symbols" --technique aop
```

The skill filters the blank catalog to all-over-print candidates before
generating the design.

## Use Standard Mockups

```text
/vaybel:launch-product "small chest logo, vintage surf club" --quality standard
```

Standard mockups are lower cost and useful for fast checks. Pro mockups remain
the default for presentation-quality output.
