---
title: underscript.constants.item
categories: underscript
parent: underscript.constants
---
Names for the things that can be rewarded or spent in the game.

## Syntax
> underscript.constants.item.*NAME*;

GOLD, UCP, DUST, EXP, ELO, DT_FRAGMENT
: Currencies and rewards

UT_PACK, DR_PACK, UTY_PACK, SHINY_PACK, SUPER_PACK, FINAL_PACK
: Packs

CARD, SKIN, AVATAR, EMOTE, PROFILE
: Cosmetics and cards

Every item has `equals(other)`, and turns into text when used as one, including in JSON.

## Examples
{% highlight javascript %}
const { item } = underscript.constants;
if (item.GOLD.equals('gold')) {
  console.log('Gold!');
}
{% endhighlight %}
