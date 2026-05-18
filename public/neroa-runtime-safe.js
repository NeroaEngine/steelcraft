(function () {
  if (window.__neroaSafeRuntimeMounted) return;
  window.__neroaSafeRuntimeMounted = true;

  var state = { open: false };

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === 'class') node.className = attrs[key];
      else if (key === 'text') node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    });
    if (html) node.innerHTML = html;
    return node;
  }

  function routeContext() {
    var path = location.pathname || '/';
    var portal = (path.match(/^\/portal\/([^/]+)/) || [])[1] || 'unknown';
    var room = (path.match(/^\/portal\/accounting\/?([^/]*)/) || [])[1] || (portal === 'accounting' ? 'today' : portal);
    return { currentPath: path, currentPortal: portal, currentRoom: room, linked_entity_type: portal, linked_entity_id: room };
  }

  function renderMessages(messages) {
    if (!messages || !messages.length) {
      return '<div class="neroa-safe-message"><strong>Neroa</strong><span>Hi, I am Neroa. How may I help you?</span></div>' +
        '<div class="neroa-safe-card"><strong>Neroa Connect</strong><span>This is the communication and setup surface. The Neroa Comptroller now lives inside the ERP Accounting room, not inside this Connect panel.</span></div>';
    }
    return messages.slice(-8).map(function (msg) {
      return '<div class="neroa-safe-message"><strong>' + (msg.sender_type === 'assistant' ? 'Neroa' : 'You') + '</strong><span>' + msg.body + '</span></div>';
    }).join('');
  }

  function renderConnect(messages) {
    var body = document.querySelector('[data-neroa-safe-body]');
    if (!body) return;
    body.innerHTML = renderMessages(messages);
  }

  function setStatus(text) {
    var status = document.querySelector('[data-neroa-safe-status]');
    if (status) status.textContent = text;
  }

  function renderShell() {
    var existing = document.querySelector('[data-neroa-safe-root]');
    if (existing) existing.remove();
    var root = el('div', { 'data-neroa-safe-root': 'true' });
    var launcher = el('button', { class: 'neroa-safe-launcher', type: 'button' }, '<span></span>Neroa Connect');
    var panel = el('section', { class: 'neroa-safe-panel', 'data-neroa-safe-panel': 'true' });
    panel.innerHTML = '' +
      '<div class="neroa-safe-head"><div><h2>Neroa Connect</h2><p>Hi, I am Neroa. I route setup, messages, help, customer/vendor communication, approvals, and proof-ready actions. The Comptroller runs inside the ERP.</p></div><button class="neroa-safe-close" type="button" data-neroa-action="close">×</button></div>' +
      '<div class="neroa-safe-status" data-neroa-safe-status>Ready.</div>' +
      '<div class="neroa-safe-body" data-neroa-safe-body></div>' +
      '<form class="neroa-safe-form" data-neroa-safe-form><input name="message" placeholder="Ask Neroa to set up, route, approve, message, or explain..." autocomplete="off" /><button type="submit">Send</button></form>';
    root.appendChild(launcher);
    root.appendChild(panel);
    document.body.appendChild(root);
    launcher.addEventListener('click', function () { state.open = true; panel.classList.add('open'); renderConnect(); });
    root.addEventListener('click', function (event) {
      var close = event.target.closest('[data-neroa-action="close"]');
      if (close) { state.open = false; panel.classList.remove('open'); }
    });
    panel.querySelector('[data-neroa-safe-form]').addEventListener('submit', sendMessage);
    renderConnect();
  }

  async function sendMessage(event) {
    event.preventDefault();
    var input = event.currentTarget.querySelector('input[name="message"]');
    var message = input.value.trim();
    if (!message) return;
    input.value = '';
    setStatus('Routing through Neroa 1...');
    try {
      var response = await fetch('/api/neroa/connect/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'frontend-user', message: message, context: routeContext() })
      });
      var json = await response.json();
      if (!json.ok) throw new Error(json.error || 'Neroa Connect failed.');
      renderConnect([json.userMessage, json.assistantMessage]);
      setStatus('Route: ' + json.route.intent + ' · ' + json.route.model_route.live_or_batch + ' · proof ' + (json.route.model_route.proof_required ? 'required' : 'audit only'));
    } catch (error) {
      renderConnect([{ sender_type: 'user', body: message }, { sender_type: 'assistant', body: 'I captured the request locally. Backend routing is stabilizing. ' + (error.message || '') }]);
      setStatus('Local fallback active.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderShell, { once: true });
  else renderShell();
}());
