$(window).on('resize', function () {
  if (window.innerWidth < 768) {
  	$('#nav-inner').removeClass('in')
  }

  if (window.innerWidth > 767 && $('#nav-inner').hasClass('in') == false) {
  	$('#nav-inner').addClass('in')
  }
})