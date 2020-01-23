define([
    'dojo/_base/declare', 
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dojo/Deferred",
    "dijit/_WidgetsInTemplateMixin",
    'jimu/BaseWidget'
],
function(
    declare, 
    lang,
    array,
    on,
    Deferred,
    BaseWidget
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget, _WidgetsInTemplateMixin], {

    // Custom widget code goes here

    name: "Allocation Details",
    baseClass: 'allocation-details',
    // this property is set by the framework when widget is loaded.
    // name: 'AllocationDetails',
    // add additional properties here



    _loadState: '',




    //methods to communication with app container:
    postCreate: function() {
      this.inherited(arguments);
      console.log('AllocationDetails::postCreate');
    },

    // startup: function() {
    //   this.inherited(arguments);
    //   console.log('AllocationDetails::startup');
    // },

     onOpen: function(){
        intialiseLayers();  
       console.log('AllocationDetails::onOpen');
     },

     onClose: function(){
        toggleTool(false);  
       console.log('AllocationDetails::onClose');
     },

     onMinimize: function(){
        toggleTool(false);  
       console.log('AllocationDetails::onMinimize');
     },

     onMaximize: function(){
        toggleTool(true);  
       console.log('AllocationDetails::onMaximize');
     },

     onSignIn: function(credential){
       console.log('AllocationDetails::onSignIn', credential);
     },

    // onSignOut: function(){
    //   console.log('AllocationDetails::onSignOut');
    // }

    // onPositionChange: function(){
    //   console.log('AllocationDetails::onPositionChange');
    // },

    // resize: function(){
    //   console.log('AllocationDetails::resize');
    // }

    //methods to communication between widgets:


    intialiseLayers: function(){
        if(this._loadState !== 'ready' && this._loadState !== 'loading') {

            this._loadState = 'loading';
            this._layers = [];




        }
    },

    _checkConfig: function() {
        if (!this.config) {
          this.config = {};
        }        
    }

  });

});
