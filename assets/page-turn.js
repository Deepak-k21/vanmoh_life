/* A page turns around its upper-left binding; routes and forms stay unchanged. */
(() => {
  let running = [];
  let ghosts = [];
  let generation = 0;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function clearTurn() {
    running.forEach(animation => animation.cancel());
    ghosts.forEach(ghost => ghost.remove());
    running = [];
    ghosts = [];
  }
  window.changeScreenWithTurn = function(render) {
    const token = ++generation;
    clearTurn();
    const previous = document.querySelector('[data-screen]:not([hidden])');
    const destination = location.hash.slice(1) || 'home';
    if (!previous || previous.dataset.screen === destination || motion.matches || !previous.animate) {
      render();
      return;
    }
    const bounds = previous.getBoundingClientRect();
    const ghost = previous.cloneNode(true);
    ghost.removeAttribute('id');
    ghost.removeAttribute('data-screen');
    ghost.removeAttribute('aria-labelledby');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.inert = true;
    ghost.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    ghost.querySelectorAll('.mobile-bottom-bar').forEach(node => node.remove());
    ghost.classList.add('page-turn-ghost');
    Object.assign(ghost.style, {
      left: `${bounds.left}px`, top: `${bounds.top}px`,
      width: `${bounds.width}px`, height: `${bounds.height}px`
    });
    // Keep the current page above its replacement while its edge turns away.
    document.body.append(ghost);
    ghosts.push(ghost);
    render();
    const active = document.querySelector('[data-screen]:not([hidden])');
    const outgoing = ghost.animate([
      { transform:'perspective(1400px) rotateY(0deg) rotateZ(0deg)', opacity:1 },
      { transform:'perspective(1400px) rotateY(-45deg) rotateZ(-1deg)', opacity:.85, offset:.45 },
      { transform:'perspective(1400px) rotateY(-100deg) rotateZ(-2deg)', opacity:0 }
    ], { duration:560, easing:'cubic-bezier(.22,.7,.2,1)', fill:'both' });
    const incoming = active.animate([
      { transform:'perspective(1400px) rotateY(16deg)', clipPath:'polygon(0 0, 0 0, 0 0, 0 0)', opacity:.4 },
      { transform:'perspective(1400px) rotateY(6deg)', clipPath:'polygon(0 0, 100% 0, 65% 100%, 0 100%)', opacity:1, offset:.65 },
      { transform:'perspective(1400px) rotateY(0deg)', clipPath:'polygon(0 0, 100% 0, 100% 100%, 0 100%)', opacity:1 }
    ], { duration:680, easing:'cubic-bezier(.2,.65,.25,1)', fill:'both' });
    running.push(outgoing, incoming);
    Promise.allSettled(running.map(animation => animation.finished)).then(() => {
      if (token === generation) clearTurn();
    });
  };
  motion.addEventListener('change', () => { ++generation; clearTurn(); });
})();
