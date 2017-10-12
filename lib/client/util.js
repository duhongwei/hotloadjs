define('lego.util', function () {
  function format(tpl) {
    var args = arguments;
    return tpl.replace(/{(\d)}/g, function () {
      return args[+arguments[1] + 1].toString();
    });
  }
  return {
    format: format
  }
});
