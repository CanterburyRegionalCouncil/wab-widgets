///////////////////////////////////////////////////////////////////////////
// Copyright © 2015 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////
define(["dojo/_base/declare", "dojo/_base/lang", "dojo/_base/html", "dojo/on", "dojo/Evented", "dojo/Deferred", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "jimu/dijit/Message", "jimu/dijit/_GeocodeServiceChooserContent", "jimu/dijit/Popup", "jimu/dijit/LoadingShelter", "esri/request", "dojo/text!./LocatorSourceSetting.html", "dijit/form/ValidationTextBox", "dijit/form/NumberTextBox"], function (declare, lang, html, on, Evented, Deferred, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Message, _GeocodeServiceChooserContent, Popup, LoadingShelter, esriRequest, template) {
  /*jshint maxlen:150*/
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented], {
    baseClass: "jimu-widget-search-locator-source-setting",
    tr: null,
    nls: null,
    config: null,
    singleLineFieldName: null,
    // validService: false,
    templateString: template,

    _suggestible: false,
    _locatorDefinition: null,
    _esriLocatorRegExp: /http(s)?:\/\/geocode(.){0,3}\.arcgis.com\/arcgis\/rest\/services\/World\/GeocodeServer/g,
    serviceChooserContent: null,
    geocoderPopup: null,

    postCreate: function postCreate() {
      this.inherited(arguments);
      this.config = this.config ? this.config : {};
      this.setConfig(this.config);
    },

    setRelatedTr: function setRelatedTr(tr) {
      this.tr = tr;
    },

    getRelatedTr: function getRelatedTr() {
      return this.tr;
    },

    setDefinition: function setDefinition(definition) {
      this._locatorDefinition = definition || {};
    },

    getDefinition: function getDefinition() {
      return this._locatorDefinition;
    },

    setConfig: function setConfig(config) {
      if (Object.prototype.toString.call(config) !== "[object Object]") {
        return;
      }

      var url = config.url;
      if (!url) {
        return;
      }
      this.config = config;

      this.shelter.show();
      if (this._locatorDefinition.url !== url) {
        this._getDefinitionFromRemote(url).then(lang.hitch(this, function (response) {
          if (response) {
            this._locatorDefinition = response;
            this._locatorDefinition.url = url;
            this._setSourceItems();
          }
          this.shelter.hide();
        }));
      } else {
        this._setSourceItems();
        this.shelter.hide();
      }
    },

    isValidConfig: function isValidConfig() {
      var config = this.getConfig();
      if (config.url && config.name && config.singleLineFieldName) {
        return true;
      } else {
        return false;
      }
    },

    showValidationTip: function showValidationTip() {
      this._showValidationErrorTip(this.locatorUrl);
      this._showValidationErrorTip(this.locatorName);
    },

    getConfig: function getConfig() {
      var geocode = {
        url: this.locatorUrl.get('value'),
        name: this.locatorName.get('value'),
        singleLineFieldName: this.singleLineFieldName,
        countryCode: this.countryCode.get('value')
      };
      return geocode;
    },

    _setSourceItems: function _setSourceItems() {
      var config = this.config;
      if (config.url) {
        // this.validService = true;
        this.locatorUrl.set('value', config.url);
        this._processCountryCodeRow(config.url);
      }
      if (config.name) {
        this.locatorName.set('value', config.name);
      }
      if (config.singleLineFieldName) {
        this.singleLineFieldName = config.singleLineFieldName;
      }
      if (config.countryCode) {
        this.countryCode.set('value', config.countryCode);
      }

      this._suggestible = this._locatorDefinition && this._locatorDefinition.capabilities && this._locatorDefinition.capabilities.indexOf("Suggest") > -1;
      if (!this._suggestible) {
        this._showSuggestibleTips();
      } else {
        this._hideSuggestibleTips();
      }
    },

    _isEsriLocator: function _isEsriLocator(url) {
      this._esriLocatorRegExp.lastIndex = 0;
      return this._esriLocatorRegExp.test(url);
    },

    _getDefinitionFromRemote: function _getDefinitionFromRemote(url) {
      var resultDef = new Deferred();
      if (this._isEsriLocator(url)) {
        // optimize time
        resultDef.resolve({
          singleLineAddressField: {
            name: "SingleLine",
            type: "esriFieldTypeString",
            alias: "Single Line Input",
            required: false,
            length: 200,
            localizedNames: {},
            recognizedNames: {}
          },
          capabilities: "Geocode,ReverseGeocode,Suggest"
        });
      } else {
        var def = esriRequest({
          url: url,
          content: {
            f: 'json'
          },
          handleAs: 'json',
          callbackParamName: 'callback'
        });
        this.own(def);
        def.then(lang.hitch(this, function (response) {
          resultDef.resolve(response);
        }), lang.hitch(this, function (err) {
          console.error(err);
          resultDef.resolve(null);
        }));
      }

      return resultDef.promise;
    },

    _onSetLocatorUrlClick: function _onSetLocatorUrlClick() {
      this.serviceChooserContent = new _GeocodeServiceChooserContent({
        url: this.locatorUrl.get('value') || ""
      });
      this.shelter = new LoadingShelter({
        hidden: true
      });

      this.geocoderPopup = new Popup({
        titleLabel: this.nls.setGeocoderURL,
        autoHeight: true,
        content: this.serviceChooserContent.domNode,
        container: window.jimuConfig.layoutId,
        width: 640
      });
      this.shelter.placeAt(this.geocoderPopup.domNode);
      html.setStyle(this.serviceChooserContent.domNode, 'width', '580px');
      html.addClass(this.serviceChooserContent.domNode, 'override-geocode-service-chooser-content');

      this.serviceChooserContent.own(on(this.serviceChooserContent, 'validate-click', lang.hitch(this, function () {
        html.removeClass(this.serviceChooserContent.domNode, 'override-geocode-service-chooser-content');
      })));
      this.serviceChooserContent.own(on(this.serviceChooserContent, 'ok', lang.hitch(this, '_onSelectLocatorUrlOk')));
      this.serviceChooserContent.own(on(this.serviceChooserContent, 'cancel', lang.hitch(this, '_onSelectLocatorUrlCancel')));
    },

    _onSelectLocatorUrlOk: function _onSelectLocatorUrlOk(evt) {
      if (!(evt && evt[0] && evt[0].url && this.domNode)) {
        return;
      }
      this.shelter.show();
      esriRequest({
        url: evt[0].url,
        content: {
          f: 'json'
        },
        handleAs: 'json',
        callbackParamName: 'callback'
      }).then(lang.hitch(this, function (response) {
        this.shelter.hide();
        if (response && response.singleLineAddressField && response.singleLineAddressField.name) {
          this.locatorUrl.set('value', evt[0].url);
          if (!this.locatorName.get('value')) {
            this.locatorName.set('value', 'New Geocoder');
          }

          this.singleLineFieldName = response.singleLineAddressField.name;

          this._processCountryCodeRow(evt[0].url);

          this._locatorDefinition = response;
          this._locatorDefinition.url = evt[0].url;
          this._suggestible = response.capabilities && this._locatorDefinition.capabilities.indexOf("Suggest") > -1;
          if (!this._suggestible) {
            this._showSuggestibleTips();
          } else {
            this._hideSuggestibleTips();
          }

          this.emit('reset-locator-source', this.getConfig());
          if (this.geocoderPopup) {
            this.geocoderPopup.close();
            this.geocoderPopup = null;
          }
        } else {
          new Message({
            message: this.nls.locatorWarning
          });
        }
      }), lang.hitch(this, function (err) {
        console.error(err);
        this.shelter.hide();
        new Message({
          message: this.nls.invalidUrlTip
        });
      }));
    },

    _onSelectLocatorUrlCancel: function _onSelectLocatorUrlCancel() {
      if (this.geocoderPopup) {
        this.geocoderPopup.close();
        this.geocoderPopup = null;
      }
    },

    _processCountryCodeRow: function _processCountryCodeRow(url) {
      if (this._isEsriLocator(url)) {
        this.countryCode.set('value', "");
        html.removeClass(this.countryCodeRow, 'hide-country-code-row');
      } else {
        html.addClass(this.countryCodeRow, 'hide-country-code-row');
      }
    },

    _showSuggestibleTips: function _showSuggestibleTips() {
      html.addClass(this.tipsNode, 'source-tips-show');
    },

    _hideSuggestibleTips: function _hideSuggestibleTips() {
      html.removeClass(this.tipsNode, 'source-tips-show');
    },

    _showValidationErrorTip: function _showValidationErrorTip(_dijit) {
      if (!_dijit.validate() && _dijit.domNode) {
        if (_dijit.focusNode) {
          var _disabled = _dijit.get('disabled');
          if (_disabled) {
            _dijit.set('disabled', false);
          }
          _dijit.focusNode.focus();
          setTimeout(lang.hitch(this, function () {
            _dijit.focusNode.blur();
            if (_disabled) {
              _dijit.set('disabled', true);
            }
            _dijit = null;
          }), 100);
        }
      }
    }
  });
});
