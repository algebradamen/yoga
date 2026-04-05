document.querySelectorAll('.pose-row').forEach(function(row) {
  function toggle() {
    var targetId = row.getAttribute('data-target');
    var detail = document.getElementById(targetId);
    var isOpen = row.classList.contains('open');
    row.classList.toggle('open', !isOpen);
    row.setAttribute('aria-expanded', String(!isOpen));
    detail.classList.toggle('open', !isOpen);
  }

  row.addEventListener('click', toggle);
  row.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});
