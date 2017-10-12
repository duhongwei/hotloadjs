define(function () { 
  var title = 'big apple'
  function getTitle() { 
    return title; 
  }
  return { 
    getTitle: getTitle
  };
})