export default function addFooterLink($after, html) {
  const $last = $after.closest('li');
  if (!$last.length) return;
  const $menu = $last.parent();
  let $header = $menu.find('li.underscript-header');
  if (!$header.length) {
    $header = $('<li class="dropdown-header underscript-header">UnderScript</li>');
    $menu.append('<li class="divider underscript-divider"></li>', $header);
  }
  $menu.append($(`<li>${html}</li>`));
}
