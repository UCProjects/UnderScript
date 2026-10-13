---
title: EventEmitter
---
Events are how UnderScript tells your code that something happened, such as a page finishing loading or a chat message arriving. Plugins get one through [`plugin.events`]({{ site.baseurl }}{% link _api/plugin/events.md %}), and `underscript.utils.eventEmitter()` creates a new one for your own use.

## Methods
on(*event*, *listener*)
: Call `listener` every time `event` happens. Several events can be listened to at once by separating them with a space.

once(*event*, *listener*)
: Call `listener` the next time `event` happens, then stop. `one()` does the same thing.

until(*event*, *listener*)
: Call `listener` every time `event` happens, until it returns `true`.

off(*event*, *listener*)
: Stop calling `listener`.

emit(*event*, ...*data*)
: Tell everyone listening to `event`, passing `data` along. Returns `{ ran, canceled }`.

emit(*options*, *event*, ...*data*)
: The same, with [options](#emit-options) that change how the event behaves.

## Listener
The listener is called with the event's data. `this` is the [event object](#event-object), so use a regular `function` for a listener that needs it, because an arrow function has no `this`.

## Event object
event: `string`
: The name of the event

cancelable: `boolean`
: Whether listeners can cancel it. Setting `canceled` only does something when this is `true`.

canceled: `boolean`
: Whether something canceled it. This always exists. Set it to `true` to cancel the event, and read it to see whether a listener before you already did.

async: `boolean`
: Whether `emit` waits for listeners that return a promise

delayed: `boolean`
: Whether the event already happened before you started listening

singleton: `boolean`
: Whether the event only happens once

{% highlight javascript %}
events.on('myevent', function listener(data) {
  if (this.cancelable && !this.canceled) {
    this.canceled = true;
  }
});
{% endhighlight %}

## Emit options
Pass an object before the event name to change how `emit` behaves:

{% highlight javascript %}
// Listeners can cancel this event
const { canceled } = events.emit({ cancelable: true }, 'myevent', data);

// Listeners can return promises to wait for
await events.emit({ async: true }, 'myevent', data);

// Use as many as you need
await events.emit({ cancelable: true, async: true }, 'myevent', data);
{% endhighlight %}

cancelable
: Listeners can set `this.canceled = true`. The result of `emit` tells you if they did.

canceled
: Start the event off as canceled. Listeners can change it back.

async
: `emit` returns a promise that waits for every listener that returned one.

singleton
: The event only happens once. Anyone who starts listening later still gets called, with the original data.

Leave an option out, or set it to `false`, to leave it off.

## Examples
{% highlight javascript %}
const events = underscript.utils.eventEmitter();

events.on('hello', function listener(name) {
  console.log(`Hello ${name}`, this.event); // Hello world hello
});
events.emit('hello', 'world');
{% endhighlight %}

Read the list of [events UnderScript emits]({{ site.baseurl }}{% link _api/events.md %}).
