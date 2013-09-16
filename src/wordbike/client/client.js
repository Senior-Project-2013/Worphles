Template.mainPage.greeting = function () {
  return "Welcome to Word Bike 3D!";
};

Template.mainPage.events({
  'click input' : function () {
    // template data, if any, is available in 'this'
    if (typeof console !== 'undefined')
      console.log("You pressed the button");
  }
});