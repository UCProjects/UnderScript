---
title: underscript.plugin()
categories: underscript
method: true
---
Create a plugin to access UnderScript's internals.

## Syntax
> underscript.plugin(*name*, *version*);

name
: Name of plugin (See [name restrictions](#restrictions))

version
: Version of your plugin, optional. A plugin with a version can use [`plugin.updater()`]({{ site.baseurl }}{% link _api/plugin/updater.md %}).

Return Value
: Returns `Plugin` object

## Methods
{% for page in site.api %}
  {% if page.plugin and page.method %}
<a href="{{ page.url | relative_url }}">{{ page.title }}</a>
: {{ page.excerpt }}
  {% endif %}
{% endfor %}

## Properties
{% for page in site.api %}
  {% if page.plugin and page.property %}
<a href="{{ page.url | relative_url }}">{{ page.title }}</a>
: {{ page.excerpt }}
  {% endif %}
{% endfor %}

## Restrictions
Plugin names have the following restrictions:

1. No two plugins may share the same name
2. Plugin names can't be longer than 20 characters
3. Plugin names can only contain alphanumeric characters and space (`A-Z0-9 `)
4. The names UnderScript and Undercards are reserved, in any letter case

A name that breaks these rules throws an error and no plugin is created.
