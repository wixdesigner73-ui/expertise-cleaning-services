(function () {
  'use strict';

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- quote form ---------- */
  var form = document.getElementById('quote-form');
  if (!form) return;

  // Where submissions are delivered. FormSubmit emails each request to the owner.
  // The owner must confirm the activation email FormSubmit sends on the first submission.
  var FORM_ENDPOINT = 'https://formsubmit.co/ajax/Everett.McDonald@yahoo.com';

  var status = document.getElementById('form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var dateInput = form.elements['preferred_date'];

  // Preferred date can't be in the past (local date).
  if (dateInput) {
    var now = new Date();
    var pad = function (n) { return String(n).padStart(2, '0'); };
    dateInput.min = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  }

  var rules = {
    name: function (v) { return v.trim() ? '' : 'Please enter your full name.'; },
    email: function (v) {
      if (!v.trim()) return 'Please enter your email address.';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.';
    },
    phone: function (v) {
      if (!v.trim()) return '';
      return v.replace(/\D/g, '').length >= 10 ? '' : 'Please enter a valid phone number, or leave it blank.';
    },
    message: function (v) { return v.trim().length >= 10 ? '' : 'Please tell us a little about your cleaning needs (at least 10 characters).'; }
  };

  function setError(field, msg) {
    var input = form.elements[field];
    var out = document.getElementById('err-' + field);
    if (!input || !out) return;
    out.textContent = msg;
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  }

  function validate(field) {
    var msg = rules[field](form.elements[field].value);
    setError(field, msg);
    return !msg;
  }

  Object.keys(rules).forEach(function (field) {
    var input = form.elements[field];
    input.addEventListener('blur', function () { validate(field); });
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') validate(field);
    });
  });

  function showStatus(type, title, html) {
    status.className = 'form-status show ' + type;
    status.innerHTML = '<strong></strong><span></span>';
    status.firstChild.textContent = title;
    status.lastChild.innerHTML = html;
    status.focus();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form-status';

    // Honeypot: bots fill this in, people never see it.
    if (form.elements['_honey'].value) return;

    var firstInvalid = null;
    Object.keys(rules).forEach(function (field) {
      if (!validate(field) && !firstInvalid) firstInvalid = form.elements[field];
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    var data = {
      'Full Name': form.elements['name'].value.trim(),
      'Email Address': form.elements['email'].value.trim(),
      'Phone Number': form.elements['phone'].value.trim() || '(not provided)',
      'Cleaning Service': form.elements['service'].value,
      'Property Type': form.elements['property'].value,
      'Preferred Date': form.elements['preferred_date'].value || '(not provided)',
      'Message': form.elements['message'].value.trim(),
      '_subject': 'New quote request from ' + form.elements['name'].value.trim(),
      '_replyto': form.elements['email'].value.trim(),
      '_template': 'table',
      '_captcha': 'false'
    };

    submitBtn.disabled = true;
    var label = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        return res.json().then(function (body) { return { ok: res.ok, body: body }; });
      })
      .then(function (r) {
        // Only report success when the service explicitly confirms delivery.
        if (r.ok && (r.body.success === true || r.body.success === 'true')) {
          form.reset();
          showStatus('success', 'Thank you — your request was sent.',
            'We have received your details and will be in touch using the email or phone number you provided.');
        } else {
          throw new Error('not delivered');
        }
      })
      .catch(function () {
        showStatus('error', 'Your request could not be sent.',
          'Nothing was delivered. Please try again, or contact us directly at <a href="tel:+15134291779">(513) 429-1779</a> or <a href="mailto:Everett.McDonald@yahoo.com">Everett.McDonald@yahoo.com</a>.');
      })
      .then(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = label;
      });
  });
})();
