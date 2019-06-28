define(["dojo/_base/declare", "jimu/BaseWidgetSetting", "dijit/_WidgetsInTemplateMixin", "dojo/_base/lang", 'dojo/_base/array', "dojo/text!./templates/ExplodeFeatures.html", "jimu/dijit/Popup", "dojo/dom-construct", 'dojo/dom-style'], function (declare, BaseWidgetSetting, _WidgetsInTemplateMixin, lang, array, ExplodeFeaturesTemplate, Popup, domConstruct, domStyle) {
  // to create a widget, derive it from BaseWidget.
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    baseClass: 'explode-features',
    templateString: ExplodeFeaturesTemplate,
    popup: null,
    layers: [],
    startup: function startup() {
      this.inherited(arguments);
    },
    postCreate: function postCreate() {
      this._createExplodeFeaturesPopup();
    },

    /**
    * create popup to display feature summary
    * @memberOf widgets/LLUREditor/components/explodeFeaturesPopup
    **/
    _createExplodeFeaturesPopup: function _createExplodeFeaturesPopup() {
      //creating ok button
      this.okButton = domConstruct.create("button", {
        title: this.nls.explodeFeaturesPopup.ok
      });
      this.okButton.label = this.nls.explodeFeaturesPopup.ok;
      this.okButton.onClick = lang.hitch(this, function () {
        this.onOkClick();
      });
      //creating cancel button
      this.cancelButton = domConstruct.create("button", {
        title: this.nls.explodeFeaturesPopup.cancel
      });
      this.cancelButton.label = this.nls.explodeFeaturesPopup.cancel;
      //initializing popup with default configuration
      this.popup = new Popup({
        titleLabel: this.nls.explodeFeaturesPopup.titleLabel,
        content: this.explodeFeaturesContainer,
        width: 500,
        autoHeight: true,
        buttons: [this.okButton, this.cancelButton]
      });
      //Setting default state of ok button as disabled
      //this.popup.disableButton(0);
    },

    onOkClick: function onOkClick(evt) {
      return evt;
    },

    destroy: function destroy() {
      this.inherited(arguments);
    }
  });
});
