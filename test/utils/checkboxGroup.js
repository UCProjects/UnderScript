import { expect } from 'chai';
import checkboxGroup, {
  getChecked,
  isCollapsed,
  revealChecked,
  setAllCollapsed,
  setChecked,
  setCollapsed,
} from '../../src/utils/checkboxGroup';

function boxes(group) {
  return group.find('input[type=checkbox]').toArray().map((el) => $(el));
}

function find(group, value) {
  return group.find(`input[value="${value}"]`).first();
}

function click(input) {
  input.prop('checked', !input.prop('checked'));
  input.trigger('change');
}

function state(input) {
  return {
    checked: input.prop('checked'),
    indeterminate: input.prop('indeterminate'),
  };
}

function values(group) {
  return getChecked(group).map(({ value }) => value);
}

const checked = { checked: true, indeterminate: false };
const unchecked = { checked: false, indeterminate: false };
const mixed = { checked: false, indeterminate: true };

describe('checkboxGroup', () => {
  describe('flat group', () => {
    let group;
    beforeEach(() => {
      group = checkboxGroup('All', ['a', 'b', 'c']);
    });

    it('returns a fieldset', () => {
      expect(group.is('fieldset.checkGroup')).to.equal(true);
    });

    it('starts unchecked', () => {
      boxes(group).forEach((input) => expect(state(input)).to.deep.equal(unchecked));
    });

    it('checking the parent checks every child', () => {
      click(find(group, 'All'));
      boxes(group).forEach((input) => expect(state(input)).to.deep.equal(checked));
    });

    it('unchecking the parent clears every child', () => {
      click(find(group, 'All'));
      click(find(group, 'All'));
      boxes(group).forEach((input) => expect(state(input)).to.deep.equal(unchecked));
    });

    it('checking some children makes the parent indeterminate', () => {
      click(find(group, 'a'));
      expect(state(find(group, 'All'))).to.deep.equal(mixed);
    });

    it('checking every child checks the parent', () => {
      ['a', 'b', 'c'].forEach((value) => click(find(group, value)));
      expect(state(find(group, 'All'))).to.deep.equal(checked);
    });

    it('unchecking the last child clears the parent', () => {
      click(find(group, 'a'));
      click(find(group, 'a'));
      expect(state(find(group, 'All'))).to.deep.equal(unchecked);
    });

    it('clicking an indeterminate parent checks every child', () => {
      click(find(group, 'a'));
      click(find(group, 'All'));
      boxes(group).forEach((input) => expect(state(input)).to.deep.equal(checked));
    });
  });

  describe('nested groups', () => {
    let group;
    beforeEach(() => {
      group = checkboxGroup('Root', [
        'top',
        checkboxGroup('Left', ['l1', 'l2']),
        checkboxGroup('Right', [
          'r1',
          checkboxGroup('Deep', ['d1', 'd2']),
        ]),
      ]);
    });

    it('checking the root checks every descendant', () => {
      click(find(group, 'Root'));
      boxes(group).forEach((input) => expect(state(input)).to.deep.equal(checked));
    });

    it('unchecking the root clears every descendant', () => {
      click(find(group, 'Root'));
      click(find(group, 'Root'));
      boxes(group).forEach((input) => expect(state(input)).to.deep.equal(unchecked));
    });

    it('clearing a middle group clears its subtree and leaves the rest', () => {
      click(find(group, 'Root'));
      click(find(group, 'Right'));
      ['r1', 'd1', 'd2', 'Deep', 'Right'].forEach((value) => {
        expect(state(find(group, value)), value).to.deep.equal(unchecked);
      });
      ['top', 'l1', 'l2', 'Left'].forEach((value) => {
        expect(state(find(group, value)), value).to.deep.equal(checked);
      });
      expect(state(find(group, 'Root'))).to.deep.equal(mixed);
    });

    it('a deep leaf marks every ancestor indeterminate', () => {
      click(find(group, 'd1'));
      expect(state(find(group, 'Deep'))).to.deep.equal(mixed);
      expect(state(find(group, 'Right'))).to.deep.equal(mixed);
      expect(state(find(group, 'Root'))).to.deep.equal(mixed);
      expect(state(find(group, 'Left'))).to.deep.equal(unchecked);
    });

    it('completing a subgroup checks it but not its ancestors', () => {
      click(find(group, 'd1'));
      click(find(group, 'd2'));
      expect(state(find(group, 'Deep'))).to.deep.equal(checked);
      expect(state(find(group, 'Right'))).to.deep.equal(mixed);
      expect(state(find(group, 'Root'))).to.deep.equal(mixed);
    });

    it('checking every leaf checks every ancestor', () => {
      ['top', 'l1', 'l2', 'r1', 'd1', 'd2'].forEach((value) => click(find(group, value)));
      ['Root', 'Left', 'Right', 'Deep'].forEach((value) => {
        expect(state(find(group, value)), value).to.deep.equal(checked);
      });
    });

    it('clearing a parent resets a stale indeterminate descendant', () => {
      click(find(group, 'd1'));
      click(find(group, 'Right'));
      click(find(group, 'Right'));
      ['Right', 'Deep', 'd1', 'd2', 'r1'].forEach((value) => {
        expect(state(find(group, value)), value).to.deep.equal(unchecked);
      });
    });
  });

  describe('mixed leaves and subgroups', () => {
    it('counts both toward the parent state', () => {
      const group = checkboxGroup('Root', ['leaf', checkboxGroup('Sub', ['s1'])]);
      click(find(group, 'leaf'));
      expect(state(find(group, 'Root'))).to.deep.equal(mixed);
      click(find(group, 's1'));
      expect(state(find(group, 'Root'))).to.deep.equal(checked);
    });
  });

  describe('naming', () => {
    it('treats a leaf named like its group as a leaf', () => {
      const group = checkboxGroup('Same', ['Same', 'other']);
      expect(boxes(group)).to.have.length(3);
      click(group.find('input[value="Same"]').last());
      expect(values(group)).to.deep.equal(['Same']);
    });

    it('supports nested groups with the same name', () => {
      const group = checkboxGroup('A', [checkboxGroup('A', ['x'])]);
      click(find(group, 'x'));
      expect(group.find('input[value="A"]').toArray().map((el) => state($(el))))
        .to.deep.equal([checked, checked]);
    });

    it('survives quotes in names', () => {
      const group = checkboxGroup('say "hi"', ["it's", '"quoted"']);
      click(group.find('input').eq(1));
      expect(state(group.find('input').first())).to.deep.equal(mixed);
      expect(values(group)).to.deep.equal(["it's"]);
    });
  });

  describe('empty group', () => {
    it('stays unchecked', () => {
      const group = checkboxGroup('Empty');
      expect(state(find(group, 'Empty'))).to.deep.equal(unchecked);
      click(find(group, 'Empty'));
      expect(state(find(group, 'Empty'))).to.deep.equal(unchecked);
    });

    it('does not count as checked in a parent', () => {
      const group = checkboxGroup('Root', ['a', checkboxGroup('Empty')]);
      click(find(group, 'a'));
      expect(state(find(group, 'Root'))).to.deep.equal(mixed);
    });
  });

  describe('labels', () => {
    it('renders HTML in labels', () => {
      const group = checkboxGroup('Root', ['<b>bold</b>']);
      expect(group.find('label span b').text()).to.equal('bold');
    });
  });

  describe('children validation', () => {
    it('rejects jQuery objects that are not groups', () => {
      expect(() => checkboxGroup('Root', [$('<div>')])).to.throw('Invalid');
    });

    it('rejects a group that already has a parent', () => {
      const sub = checkboxGroup('Sub', ['x']);
      checkboxGroup('One', [sub]);
      expect(() => checkboxGroup('Two', [sub])).to.throw('already');
    });
  });

  describe('getChecked', () => {
    it('is empty when nothing is checked', () => {
      expect(getChecked(checkboxGroup('Root', ['a', 'b']))).to.deep.equal([]);
    });

    it('returns checked leaves at any depth with meta', () => {
      const group = checkboxGroup('Root', [
        ['a', { id: 1 }],
        checkboxGroup('Sub', [['b', { id: 2 }], ['c', { id: 3 }]]),
      ]);
      click(find(group, 'a'));
      click(find(group, 'c'));
      expect(getChecked(group)).to.deep.equal([
        { value: 'a', meta: { id: 1 } },
        { value: 'c', meta: { id: 3 } },
      ]);
    });

    it('never includes parent boxes', () => {
      const group = checkboxGroup('Root', ['a', checkboxGroup('Sub', ['b'])]);
      click(find(group, 'Root'));
      expect(values(group)).to.deep.equal(['a', 'b']);
    });

    it('works on a subgroup', () => {
      const sub = checkboxGroup('Sub', ['b', 'c']);
      const group = checkboxGroup('Root', ['a', sub]);
      click(find(group, 'Root'));
      expect(values(sub)).to.deep.equal(['b', 'c']);
    });

    it('leaves meta undefined when none is given', () => {
      const group = checkboxGroup('Root', ['a']);
      click(find(group, 'a'));
      expect(getChecked(group)).to.deep.equal([{ value: 'a', meta: undefined }]);
    });
  });
  describe('collapsing', () => {
    function toggle(group) {
      return group.children('legend').children('.checkToggle');
    }

    it('has no toggle when it is not collapsible', () => {
      const group = checkboxGroup('Root', ['a'], { collapsible: false });
      expect(toggle(group).length).to.equal(0);
    });

    it('marks groups that are not collapsible', () => {
      expect(checkboxGroup('Root', ['a'], { collapsible: false }).hasClass('checkFixed')).to.equal(true);
      expect(checkboxGroup('Root', ['a']).hasClass('checkFixed')).to.equal(false);
    });

    it('ignores collapsing when it is not collapsible', () => {
      const group = checkboxGroup('Root', ['a'], { collapsible: false, collapsed: true });
      expect(isCollapsed(group)).to.equal(false);
      setCollapsed(group, true);
      expect(isCollapsed(group)).to.equal(false);
      expect(group.hasClass('collapsed')).to.equal(false);
    });

    it('is never collapsed by revealChecked or setAllCollapsed', () => {
      const fixed = checkboxGroup('Fixed', ['a'], { collapsible: false });
      const root = checkboxGroup('Root', [fixed, checkboxGroup('Other', ['b'])]);
      revealChecked(root);
      setAllCollapsed(root, true);
      expect(isCollapsed(fixed)).to.equal(false);
    });

    it('starts expanded with a toggle', () => {
      const group = checkboxGroup('Root', ['a']);
      expect(toggle(group).length).to.equal(1);
      expect(toggle(group).attr('aria-expanded')).to.equal('true');
      expect(isCollapsed(group)).to.equal(false);
      expect(group.hasClass('collapsed')).to.equal(false);
    });

    it('can start collapsed', () => {
      const group = checkboxGroup('Root', ['a'], { collapsed: true });
      expect(isCollapsed(group)).to.equal(true);
      expect(group.hasClass('collapsed')).to.equal(true);
      expect(toggle(group).attr('aria-expanded')).to.equal('false');
    });

    it('clicking the toggle collapses and expands', () => {
      const group = checkboxGroup('Root', ['a']);
      toggle(group).trigger('click');
      expect(isCollapsed(group)).to.equal(true);
      expect(toggle(group).attr('aria-expanded')).to.equal('false');
      toggle(group).trigger('click');
      expect(isCollapsed(group)).to.equal(false);
      expect(toggle(group).attr('aria-expanded')).to.equal('true');
    });

    it('does not change what is checked', () => {
      const group = checkboxGroup('Root', ['a', 'b']);
      click(find(group, 'a'));
      toggle(group).trigger('click');
      expect(state(find(group, 'Root'))).to.deep.equal(mixed);
      expect(state(find(group, 'a'))).to.deep.equal(checked);
      expect(values(group)).to.deep.equal(['a']);
    });

    it('checking a collapsed parent still checks hidden children', () => {
      const group = checkboxGroup('Root', ['a', 'b'], { collapsed: true });
      click(find(group, 'Root'));
      expect(values(group)).to.deep.equal(['a', 'b']);
    });

    it('collapses each group on its own', () => {
      const sub = checkboxGroup('Sub', ['b']);
      const group = checkboxGroup('Root', ['a', sub]);
      setCollapsed(sub, true);
      expect(isCollapsed(sub)).to.equal(true);
      expect(isCollapsed(group)).to.equal(false);
    });

    it('setCollapsed works from code', () => {
      const group = checkboxGroup('Root', ['a']);
      setCollapsed(group, true);
      expect(group.hasClass('collapsed')).to.equal(true);
      setCollapsed(group, false);
      expect(group.hasClass('collapsed')).to.equal(false);
    });
  });

  describe('empty groups', () => {
    it('show an empty line', () => {
      const group = checkboxGroup('Root');
      expect(group.children('.checkEmpty').text()).to.equal('(empty)');
    });

    it('do not show it when there are children', () => {
      const group = checkboxGroup('Root', ['a']);
      expect(group.children('.checkEmpty').length).to.equal(0);
    });

    it('lose the line once something is added', () => {
      const group = checkboxGroup('Root', ['a', checkboxGroup('Empty')]);
      expect(group.children('.checkEmpty').length).to.equal(0);
      expect(group.find('.checkGroup .checkEmpty').length).to.equal(1);
    });

    it('never count the line as a checkbox or a value', () => {
      const group = checkboxGroup('Root', [checkboxGroup('Empty')]);
      expect(boxes(group).length).to.equal(2);
      expect(values(group)).to.deep.equal([]);
    });
  });

  describe('setChecked', () => {
    it('checks the leaves the predicate accepts', () => {
      const group = checkboxGroup('Root', [['a', { n: 1 }], ['b', { n: 2 }], ['c', { n: 3 }]]);
      setChecked(group, ({ meta }) => meta.n !== 2);
      expect(values(group)).to.deep.equal(['a', 'c']);
    });

    it('passes the value and meta to the predicate', () => {
      const group = checkboxGroup('Root', [['a', { n: 1 }]]);
      const seen = [];
      setChecked(group, (leaf) => {
        seen.push(leaf);
        return false;
      });
      expect(seen).to.deep.equal([{ value: 'a', meta: { n: 1 } }]);
    });

    it('unchecks leaves the predicate rejects', () => {
      const group = checkboxGroup('Root', ['a', 'b']);
      click(find(group, 'Root'));
      setChecked(group, ({ value }) => value === 'b');
      expect(values(group)).to.deep.equal(['b']);
    });

    it('updates parent and indeterminate state at every depth', () => {
      const group = checkboxGroup('Root', [
        'a',
        checkboxGroup('Sub', ['b', checkboxGroup('Deep', ['c', 'd'])]),
      ]);
      setChecked(group, ({ value }) => value === 'c');
      expect(state(find(group, 'Deep'))).to.deep.equal(mixed);
      expect(state(find(group, 'Sub'))).to.deep.equal(mixed);
      expect(state(find(group, 'Root'))).to.deep.equal(mixed);
      setChecked(group, () => true);
      ['Deep', 'Sub', 'Root'].forEach((name) => {
        expect(state(find(group, name))).to.deep.equal(checked);
      });
      setChecked(group, () => false);
      ['Deep', 'Sub', 'Root'].forEach((name) => {
        expect(state(find(group, name))).to.deep.equal(unchecked);
      });
    });

    it('refreshes the ancestors when used on a subgroup', () => {
      const sub = checkboxGroup('Sub', ['b', 'c']);
      const group = checkboxGroup('Root', ['a', sub]);
      setChecked(sub, () => true);
      expect(state(find(group, 'Sub'))).to.deep.equal(checked);
      expect(state(find(group, 'Root'))).to.deep.equal(mixed);
      expect(values(group)).to.deep.equal(['b', 'c']);
    });

    it('ignores the (empty) line', () => {
      const group = checkboxGroup('Root', ['a', checkboxGroup('Empty')]);
      setChecked(group, () => true);
      expect(values(group)).to.deep.equal(['a']);
    });
  });

  describe('revealChecked', () => {
    function tree() {
      const deep = checkboxGroup('Deep', ['d1', 'd2'], { collapsed: true });
      const left = checkboxGroup('Left', ['l1', deep], { collapsed: true });
      const right = checkboxGroup('Right', ['r1'], { collapsed: true });
      const root = checkboxGroup('Root', [left, right]);
      return { root, left, right, deep };
    }

    it('expands groups that contain checked leaves, at any depth', () => {
      const { root, left, right, deep } = tree();
      click(find(root, 'd2'));
      revealChecked(root);
      expect(isCollapsed(left)).to.equal(false);
      expect(isCollapsed(deep)).to.equal(false);
      expect(isCollapsed(right)).to.equal(true);
    });

    it('collapses groups that have nothing checked', () => {
      const { root, left, right } = tree();
      setCollapsed(left, false);
      setCollapsed(right, false);
      click(find(root, 'r1'));
      revealChecked(root);
      expect(isCollapsed(left)).to.equal(true);
      expect(isCollapsed(right)).to.equal(false);
    });

    it('leaves the group it is called on alone', () => {
      const root = checkboxGroup('Root', ['a'], { collapsed: true });
      revealChecked(root);
      expect(isCollapsed(root)).to.equal(true);
    });

    it('stops at the given depth', () => {
      const { root, left, right, deep } = tree();
      click(find(root, 'd2'));
      click(find(root, 'r1'));
      revealChecked(root, 1);
      expect(isCollapsed(left)).to.equal(false);
      expect(isCollapsed(right)).to.equal(false);
      expect(isCollapsed(deep)).to.equal(true);
    });

    it('leaves groups below the depth as they were', () => {
      const { root, left, deep } = tree();
      setCollapsed(deep, false);
      setCollapsed(left, false);
      revealChecked(root, 1);
      expect(isCollapsed(left)).to.equal(true);
      expect(isCollapsed(deep)).to.equal(false);
    });

    it('collapses everything below when nothing is checked', () => {
      const { root, left, right, deep } = tree();
      [left, right, deep].forEach((group) => setCollapsed(group, false));
      revealChecked(root);
      [left, right, deep].forEach((group) => expect(isCollapsed(group)).to.equal(true));
    });
  });

  describe('setAllCollapsed', () => {
    function tree() {
      const deep = checkboxGroup('Deep', ['d1']);
      const left = checkboxGroup('Left', ['l1', deep]);
      const right = checkboxGroup('Right', ['r1']);
      const root = checkboxGroup('Root', [left, right]);
      return { root, left, right, deep };
    }

    it('collapses every group below, at any depth', () => {
      const { root, left, right, deep } = tree();
      setAllCollapsed(root, true);
      [left, right, deep].forEach((group) => expect(isCollapsed(group)).to.equal(true));
    });

    it('expands them again', () => {
      const { root, left, right, deep } = tree();
      setAllCollapsed(root, true);
      setAllCollapsed(root, false);
      [left, right, deep].forEach((group) => expect(isCollapsed(group)).to.equal(false));
    });

    it('leaves the group it is called on alone', () => {
      const { root } = tree();
      setAllCollapsed(root, true);
      expect(isCollapsed(root)).to.equal(false);
    });

    it('does not change what is checked', () => {
      const { root } = tree();
      click(find(root, 'l1'));
      setAllCollapsed(root, true);
      expect(values(root)).to.deep.equal(['l1']);
    });
  });

  describe('accessibility', () => {
    function toggle(group) {
      return group.children('legend').children('.checkToggle');
    }

    it('names the toggle after the group', () => {
      const group = checkboxGroup('Legendary', ['a']);
      expect(toggle(group).attr('aria-label')).to.equal('Legendary');
    });

    it('names the toggle with the text of an html label', () => {
      const group = checkboxGroup('Dad &amp; Dog x2', ['a']);
      expect(toggle(group).attr('aria-label')).to.equal('Dad & Dog x2');
    });

    it('keeps the name when the group collapses', () => {
      const group = checkboxGroup('Legendary', ['a']);
      toggle(group).trigger('click');
      expect(toggle(group).attr('aria-label')).to.equal('Legendary');
      expect(toggle(group).attr('aria-expanded')).to.equal('false');
    });

    it('points the toggle at the members it controls', () => {
      const sub = checkboxGroup('Sub', ['b']);
      const group = checkboxGroup('Root', ['a', sub]);
      const ids = toggle(group).attr('aria-controls').split(' ');
      expect(ids).to.have.length(2);
      const members = group.children().not('legend');
      expect(ids).to.deep.equal(members.toArray().map((el) => el.id));
    });

    it('adds members to aria-controls as they join', () => {
      const group = checkboxGroup('Root');
      expect(toggle(group).attr('aria-controls')).to.equal(undefined);
      const sub = checkboxGroup('Sub', ['x']);
      group.data('checkboxGroup').add(sub);
      expect(toggle(group).attr('aria-controls')).to.equal(sub.attr('id'));
    });

    it('never reuses an id', () => {
      const one = checkboxGroup('One', ['a', 'b']);
      const two = checkboxGroup('Two', ['c', 'd']);
      const ids = [one, two].flatMap((group) => toggle(group).attr('aria-controls').split(' '));
      expect(new Set(ids).size).to.equal(4);
    });

    it('keeps an id the caller already set', () => {
      const sub = checkboxGroup('Sub', ['b']).attr('id', 'mine');
      const group = checkboxGroup('Root', [sub]);
      expect(toggle(group).attr('aria-controls')).to.equal('mine');
    });
  });
});
