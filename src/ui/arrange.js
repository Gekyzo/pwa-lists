import * as store from '#store';
import * as lists from '#lists';
import { $, state, ui, commit, render } from '#ui/context';
import { atTop, arrangeChoices, shownGroup } from '#ui/view';
import { collapse, expand, rowTops, slide, groupOnlyRows } from '#ui/motion';

// True while the groups of a list close, before the list becomes flat.
let ungrouping = false;

// The design system sizes and moves the knob by child position, hidden choices included:
// count only the choices that show.
const placeGroupKnob = () => {
  const choices = [...document.querySelectorAll('#arrange-group button')].filter((button) => !button.hidden);
  const index = choices.findIndex((button) => button.getAttribute('aria-pressed') === 'true');
  const segmented = document.querySelector('#arrange-group .segmented');
  segmented.style.setProperty('--segment-count', String(choices.length));
  segmented.style.setProperty('--segment-index', String(Math.max(0, index)));
};

export const renderArrange = () => {
  // At the first level the sheet orders the lists and gives their view; inside a list it groups and
  // orders the items.
  const { aisle, sort, view, listSort } = arrangeChoices();
  const group = aisle;
  const order = sort || listSort;
  const any = group || order || view;
  if (!any) ui.arrangeOpen = false;
  $('arrange-button').hidden = !any;
  $('arrange-button').setAttribute('aria-expanded', String(ui.arrangeOpen));
  $('arrange').hidden = !ui.arrangeOpen;
  $('arrange-view').hidden = !view;
  document.querySelectorAll('#arrange-view button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.view === state.view));
  });
  $('arrange-group').hidden = !group;
  $('arrange-sort').hidden = !order;
  const shows = { aisle, none: true };
  // The view shows no group for a choice that it cannot show.
  const pressed = shownGroup();
  document.querySelectorAll('#arrange-group button').forEach((button) => {
    button.hidden = !shows[button.dataset.group];
    button.setAttribute('aria-pressed', String(button.dataset.group === pressed));
  });
  placeGroupKnob();
  const current = atTop() ? state.listSort : state.sort;
  document.querySelectorAll('#arrange-sort button').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.sort === current));
  });
};

export const closeArrange = () => {
  ui.arrangeOpen = false;
  render();
};

export const bind = () => {
  $('arrange-button').addEventListener('click', () => {
    Object.assign(ui, { arrangeOpen: true, openId: null });
    render();
  });
  $('arrange-veil').addEventListener('click', closeArrange);
  // The sheet stays open after a choice, so that the group and the order change in one visit.
  document.querySelectorAll('#arrange-group button').forEach((button) => {
    button.addEventListener('click', () => {
      const { group } = button.dataset;
      // A tap on the choice that the view shows changes nothing: the stored choice can be a
      // grouping that only the other list shows.
      if (group === shownGroup() && !ungrouping) return;
      // The rows that stay move to their new place.
      const set = () => {
        const before = rowTops();
        commit(store.setGroup(state, group).state);
        return before;
      };
      // The view can show no group for a choice that it cannot show.
      const flat = shownGroup() === 'none';
      if (group !== 'none' || flat) {
        const opens = group !== 'none' && flat;
        // A tap on a grouping while the groups close keeps them.
        ungrouping = false;
        const before = set();
        // `slide` reads the places after `expand` starts, so the two effects add up to one move.
        if (opens) expand(groupOnlyRows());
        slide(before);
        return;
      }
      if (ungrouping) return;
      ungrouping = true;
      // Show the choice at once; the render after the effect writes the same value.
      document.querySelectorAll('#arrange-group button').forEach((other) => {
        other.setAttribute('aria-pressed', String(other === button));
      });
      placeGroupKnob();
      // The groups close before the list becomes flat.
      collapse(groupOnlyRows(), () => {
        if (!ungrouping) return;
        ungrouping = false;
        slide(set());
      });
    });
  });
  document.querySelectorAll('#arrange-sort button').forEach((button) => {
    button.addEventListener('click', () => {
      const before = rowTops();
      const set = atTop() ? lists.setListSort : store.setSort;
      commit(set(state, button.dataset.sort).state);
      slide(before);
    });
  });
  document.querySelectorAll('#arrange-view button').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.view !== state.view) commit(lists.setListView(state, button.dataset.view).state);
    });
  });
};
