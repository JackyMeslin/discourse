// for android we test webkit
const hiddenProperty =
  document.hidden !== undefined
    ? "hidden"
    : document.webkitHidden !== undefined
    ? "webkitHidden"
    : undefined;

const MAX_UNSEEN_TIME = 60000;

let seenUserTime = Date.now();

export default function (maxUnseenTime) {
  maxUnseenTime = maxUnseenTime === undefined ? MAX_UNSEEN_TIME : maxUnseenTime;
  const now = Date.now();

  if (seenUserTime + maxUnseenTime < now) {
    return false;
  }

  if (hiddenProperty !== undefined) {
    return !document[hiddenProperty];
  } else {
    return document && document.hasFocus;
  }
}

const callbacks = [];

const MIN_DELTA = 60000;

export function seenUser() {
  let lastSeenTime = seenUserTime;
  seenUserTime = Date.now();
  let delta = seenUserTime - lastSeenTime;

  if (lastSeenTime && delta > MIN_DELTA) {
    callbacks.forEach((info) => {
      if (delta > info.unseenTime) {
        info.callback();
      }
    });
  }
}

// register a callback for cases where presence changed
export function onPresenceChange({ unseenTime, callback }) {
  if (unseenTime < MIN_DELTA) {
    throw "unseenTime is too short";
  }
  callbacks.push({ unseenTime, callback });
}

// We could piggieback on the Scroll mixin, but it is not applied
// consistently to all pages
//
// We try to keep this as cheap as possible by performing absolute minimal
// amount of work when the event handler is fired
//
// An alternative would be to use a timer that looks at the scroll position
// however this will not work as message bus can issue page updates and scroll
// page around when user is not present
//
// We avoid tracking mouse move which would be very expensive

$(document).bind("touchmove.discourse-track-presence", seenUser);
$(document).bind("click.discourse-track-presence", seenUser);
$(window).bind("scroll.discourse-track-presence", seenUser);
