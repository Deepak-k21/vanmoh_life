/* Vanmoh Life 3D Book Page Turn Animation (Fail-Safe & Silky Smooth) */
(() => {
  let running = [];
  let ghosts = [];
  let generation = 0;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function clearTurn() {
    running.forEach(animation => {
      try { animation.cancel(); } catch(e) {}
    });
    ghosts.forEach(ghost => {
      try { ghost.remove(); } catch(e) {}
    });
    document.querySelectorAll('.page-turn-ghost').forEach(el => el.remove());
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
      left: bounds.left + 'px',
      top: bounds.top + 'px',
      width: bounds.width + 'px',
      height: bounds.height + 'px',
      position: 'fixed',
      zIndex: '40',
      pointerEvents: 'none',
      transformOrigin: '0 0',
      backfaceVisibility: 'hidden',
      background: 'var(--bg)',
      overflow: 'hidden',
      borderRadius: '16px',
      boxShadow: '14px 8px 36px rgba(19, 44, 73, 0.15)'
    });

    document.body.append(ghost);
    ghosts.push(ghost);
    
    // Switch the active DOM screen underneath
    render();
    
    const active = document.querySelector('[data-screen]:not([hidden])');
    if (!active || !active.animate) {
      clearTurn();
      return;
    }

    // 3D Outgoing Page Curl
    const outgoing = ghost.animate([
      { transform: 'perspective(1400px) rotateY(0deg) rotateZ(0deg)', opacity: 1 },
      { transform: 'perspective(1400px) rotateY(-45deg) rotateZ(-1deg)', opacity: 0.85, offset: 0.45 },
      { transform: 'perspective(1400px) rotateY(-100deg) rotateZ(-2deg)', opacity: 0 }
    ], { duration: 420, easing: 'cubic-bezier(.22, .7, .2, 1)', fill: 'forwards' });

    // 3D Incoming Page Reveal
    const incoming = active.animate([
      { transform: 'perspective(1400px) rotateY(14deg)', opacity: 0.5 },
      { transform: 'perspective(1400px) rotateY(4deg)', opacity: 0.9, offset: 0.65 },
      { transform: 'perspective(1400px) rotateY(0deg)', opacity: 1 }
    ], { duration: 460, easing: 'cubic-bezier(.2, .65, .25, 1)', fill: 'forwards' });

    running.push(outgoing, incoming);

    // Guaranteed cleanup timeout prevents any frozen ghost from lingering
    setTimeout(() => {
      clearTurn();
    }, 480);

    Promise.allSettled(running.map(a => a.finished)).then(() => {
      clearTurn();
    });
  };

  motion.addEventListener('change', () => { ++generation; clearTurn(); });
})();
