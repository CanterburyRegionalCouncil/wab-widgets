define(['dojo/_base/declare', 'jimu/BaseWidgetSetting'], function (declare, BaseWidgetSetting) {

  return declare([BaseWidgetSetting], {
    baseClass: 'allocation-details-setting',

    postCreate: function postCreate() {
      //the config object is passed in
      this.setConfig(this.config);
    },

    setConfig: function setConfig(config) {
      this.textNode.value = config.serviceUrl;
    },

    getConfig: function getConfig() {
      //WAB will get config object through this method
      return {
        serviceUrl: this.textNode.value
      };
    }
  });
});
