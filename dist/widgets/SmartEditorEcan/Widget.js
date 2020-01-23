function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 - 2017 Esri. All Rights Reserved.
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

// jscs:disable validateIndentation

define(["dojo/Stateful", 'dojo', 'dijit', 'dojo/_base/declare', 'dojo/_base/lang', 'dojo/_base/array', 'dojo/_base/html', 'dojo/query', 'dojo/i18n!esri/nls/jsapi', 'dojo/dom', 'dojo/dom-construct', 'dojo/dom-class', 'dojo/on', 'dojo/json', 'dojo/topic', 'dijit/_WidgetsInTemplateMixin', 'jimu/BaseWidget', 'jimu/LayerInfos/LayerInfos', 'jimu/dijit/Message', "esri/dijit/editing/TemplatePicker", "esri/dijit/AttributeInspector", "esri/toolbars/draw", "esri/toolbars/edit", "esri/tasks/query", "esri/graphic", "esri/layers/FeatureLayer", "dojo/promise/all", "dojo/Deferred", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Color", "esri/geometry/jsonUtils", "esri/geometry/Polyline", "esri/geometry/Polygon", "dijit/registry", "./utils", "./smartAttributes", "./attributeInspectorTools", "dijit/form/CheckBox", "dijit/form/Button", "dijit/form/DropDownButton", 'dijit/DropDownMenu', "dijit/MenuItem", 'dijit/form/DateTextBox', 'dijit/form/NumberSpinner', 'dijit/form/NumberTextBox', 'dijit/form/FilteringSelect', 'dijit/form/TextBox', 'dijit/form/ValidationTextBox', 'dijit/form/TimeTextBox', "dijit/Editor", "dijit/form/SimpleTextarea", 'dojo/store/Memory', 'dojo/date/stamp', "jimu/dijit/Popup", "./AttachmentUploader", "esri/lang", "esri/renderers/jsonUtils", "dojox/html/entities", 'jimu/utils', 'jimu/portalUrlUtils', 'jimu/SelectionManager', './SEFilterEditor', './SEDrawingOptions', './PrivilegeUtil',

/* ECAN ADDITION REQUIRES */
'esri/urlUtils', 'esri/geometry/geometryEngine', 'dojo/dom-attr', './components/operationLink', './components/copyFeaturesPopup', './components/mergeFeaturesPopup', './components/explodeFeaturesPopup', 'jimu/dijit/LoadingShelter'], function (Stateful, dojo, dijit, declare, lang, array, html, query, esriBundle, dom, domConstruct, domClass, on, JSON, topic, _WidgetsInTemplateMixin, BaseWidget, LayerInfos, Message, TemplatePicker, AttributeInspector, Draw, Edit, Query, Graphic, FeatureLayer, all, Deferred, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, geometryJsonUtil, Polyline, Polygon, registry, editUtils, smartAttributes, attributeInspectorTools, CheckBox, Button, DropDownButton, DropDownMenu, MenuItem, DateTextBox, NumberSpinner, NumberTextBox, FilteringSelect, TextBox, ValidationTextBox, TimeTextBox, Editor, SimpleTextarea, Memory, dojoStamp, Popup, AttachmentUploader, esriLang, rendererJsonUtils, entities, utils, portalUrlUtils, SelectionManager, SEFilterEditor, SEDrawingOptions, PrivilegeUtil, esriUrlUtils, geometryEngine, domAttr, OperationLink, CopyFeaturesPopup, MergeFeaturesPopup, ExplodeFeaturesPopup) {
  var _declare;

  return declare([BaseWidget, _WidgetsInTemplateMixin], (_declare = {
    name: 'SmartEditorEcan',
    baseClass: 'jimu-widget-smartEditor-ecan',
    _defaultStartStr: "",
    _defaultAddPointStr: "",
    _jimuLayerInfos: null,
    _mapClick: null,
    settings: null,
    templatePicker: null,
    attrInspector: null,
    editToolbar: null,
    _isDirty: false,
    updateFeatures: [],
    currentFeature: null,
    currentLayerInfo: null,
    _attrInspIsCurrentlyDisplayed: false,
    _ignoreEditGeometryToggle: false,
    _editingEnabled: false,
    _usePresetValues: false,
    _creationDisabledOnAll: false,
    _editGeomSwitch: null,
    _autoSaveRuntime: false,
    _userHasPrivilege: false,
    _eventHandler: null,
    _createOverDef: null,
    featureReductionEnabledLayers: [],
    clusterState: true,
    //widget_loaded: declare([Stateful], {
    //  loaded: null,
    //  _loadedGetter: function () {
    //    return this.loaded;
    //  },
    //  _loadedSetter: function (value) {
    //    this.loaded = value;
    //  }
    //}),
    _copyExistingValues: false,
    _drawToolEditMode: false,
    postCreate: function postCreate() {
      this.inherited(arguments);
      console.log('SmartEditorEcan::postCreate');

      /* BEGIN: Ecan Changes */

      this._setLinkInfo();
      this._mapAddRemoveLayerHandler(true);

      /* END: Ecan Changes */
    },

    startup: function startup() {
      this.inherited(arguments);
      this._createOverDef = new Deferred();
      //this.loaded_state = new this.widget_loaded({
      //  loaded: false
      //});
      if (this.config.editor.hasOwnProperty("displayPresetTop")) {
        if (this.config.editor.displayPresetTop === true) {
          dojo.place('presetFieldsTableDiv', 'templatePickerDiv', 'before');
        }
      }
      topic.subscribe("smartEditor/validate", lang.hitch(this, this._validateEventHandler));
      this._progressDiv = domConstruct.create("div", { "class": "processing-indicator-panel" });
      var parentDom = this.getParent().domNode.parentNode;
      parentDom.insertBefore(this._progressDiv, parentDom.firstChild);

      this.widgetActiveIndicator = domConstruct.create("div", { "class": "widgetActive widgetIndicator" });
      parentDom.insertBefore(this.widgetActiveIndicator, parentDom.firstChild);

      if (this.config.editor.editDescription === undefined || this.config.editor.editDescription === null) {
        this.config.editor.editDescription = '';
        this.templateTitle.innerHTML = this.config.editor.editDescription;
      } else {
        this.templateTitle.innerHTML = entities.decode(this.config.editor.editDescription);
      }
      this._orignls = esriBundle.widgets.attachmentEditor.NLS_attachments;
      //this.nls = lang.mixin(this.nls, window.jimuNls.common);
      //this.loading = new LoadingShelter({
      //  hidden: true
      //});
      //this.loading.placeAt(this.domNode);

      this.editToolbar = new Edit(this.map);
      this.drawToolbar = new Draw(this.map);

      this._createDrawingToolbar();

      /* BEGIN: Ecan Changes */

      this._updateLinksUI();
      this._copyExistingValues = this.config.editor.copyExistingValues || false;

      /* END: Ecan Changes */

      // edit events
      this.own(on(this.editToolbar, "graphic-move-stop, rotate-stop, scale-stop, vertex-move-stop, vertex-click", lang.hitch(this, function () {
        this.geometryChanged = true;
        this._enableAttrInspectorSaveButton(this._validateAttributes());
      })));

      // draw event
      this.own(on(this.drawToolbar, "draw-end", lang.hitch(this, function (evt) {
        this.drawToolbar.deactivate();

        /* BEGIN: Ecan Changes - Handle edit tools using the draw tool i.e. cut, reshape */

        if (this._drawToolEditMode) {
          this._actionEditTool(evt);
        } else {
          if (this.templatePicker !== undefined && this.templatePicker !== null && this.templatePicker.getSelected() === null) {
            // In select mode - use as select geometry
            this._processOnMapClick(evt);
          } else {
            // In create featuyre mode - process to layers
            this._addGraphicToLocalLayer(evt);
          }
        }

        /* END: Ecan Changes */
      })));

      this.privilegeUtil = PrivilegeUtil.getInstance();
      //<div class="processing-indicator-panel"></div>
      this.nls = lang.mixin(this.nls, window.jimuNls.common);
      this._setTheme();
      this.shelter.show();
      LayerInfos.getInstance(this.map, this.map.itemInfo).then(lang.hitch(this, function (operLayerInfos) {

        var timeoutValue;
        if (this.appConfig.theme.name === "BoxTheme") {
          timeoutValue = 1050;
        } else {
          timeoutValue = 1;
        }
        setTimeout(lang.hitch(this, function () {
          //Function below was to load level 1 user and disable the widget, but since level 1 should be able to edit
          //public services, all paths initialize the control
          this.privilegeUtil.loadPrivileges(this._getPortalUrl()).then(lang.hitch(this, function (status) {
            var valid = true;
            this._user = null;
            if (!status) {
              valid = this._initControl(operLayerInfos);
            } else {
              var userInfo = this.privilegeUtil.getUser();
              if (userInfo) {
                this._user = userInfo.username;
              }

              if (this.privilegeUtil.userRole.canEditFeatures() === true) {
                valid = this._initControl(operLayerInfos);
              } else if (this.privilegeUtil.userRole.canEditFeaturesFullControl === true) {
                valid = this._initControl(operLayerInfos);
              } else {
                valid = this._initControl(operLayerInfos);
                //this._noPrivilegeHandler(window.jimuNls.noEditPrivileges);//this.nls.noEditPrivileges);
              }
            }
            if (valid === false) {
              this._noPrivilegeHandler(window.jimuNls.invalidConfiguration); //this.nls.invalidConfiguration);
            }

            this.shelter.hide();
          }), lang.hitch(this, function () {
            this._initControl(operLayerInfos);
            //this._noPrivilegeHandler(window.jimuNls.noEditPrivileges);//this.nls.noEditPrivileges);
          }));
          this.shelter.hide();
          this._workBeforeCreate();
        }), timeoutValue);
      }));
    },

    _noPrivilegeHandler: function _noPrivilegeHandler(message) {
      this.templateTitle.innerHTML = message;
      if (this.templatePicker) {
        dojo.style(this.templatePicker.domNode, "display", "none");
        if (this.drawingTool) {
          dojo.style(this.drawingTool.domNode, "display", "none");
        }
        if (this._mapClick) {

          this._mapClick.remove();
          this._mapClick = null;
        }
      }
      this.map.setInfoWindowOnClick(true);
      this.shelter.hide();
    },
    _getPortalUrl: function _getPortalUrl(url) {
      if (url) {
        return portalUrlUtils.getStandardPortalUrl(url);
      } else {
        return portalUrlUtils.getStandardPortalUrl(this.appConfig.portalUrl);
      }
    },
    feature_action_select: function feature_action_select(features, featureLayer) {
      // features probably is empty.
      if (!featureLayer) {
        return;
      }
      if (!features) {
        return;
      }
      if (features.length === 0) {
        return;
      }
      if (this.state !== 'active') {
        this.widgetManager.activateWidget(this);
      }

      /* BEGIN CHANGE - Handle multiple selected features 
       // ORIGINAL CODE
       var firstFeature = features[0];
      if (this._validateFeatureChanged() && this.currentFeature) {
        // do not show templatePicker after saving
        if (this.config.editor.displayPromptOnSave && this.config.editor.displayPromptOnSave === true) {
          this._promptToResolvePendingEdit(false, { featureLayer: featureLayer, feature: firstFeature }, false, true);
        }
      } else {
        this.load_from_featureaction(featureLayer, firstFeature);
      }
       */

      if (this._validateFeatureChanged() && this.currentFeature) {
        // do not show templatePicker after saving
        if (this.config.editor.displayPromptOnSave && this.config.editor.displayPromptOnSave === true) {
          this._promptToResolvePendingEdit(false, { featureLayer: featureLayer, feature: features }, false, true);
        }
      } else {
        this.load_from_featureaction(featureLayer, features);
      }
    },
    load_from_featureaction: function load_from_featureaction(featureLayer, feature) {
      if (this.updateFeatures) {
        var layersRefresh = [];
        array.forEach(this.updateFeatures, lang.hitch(this, function (feature) {
          var layer = feature.getLayer();
          if (layersRefresh && layersRefresh.indexOf(layer.id) === -1) {
            layersRefresh.push(layer.id);
            layer.clearSelection();
            layer.refresh();
          }
        }));
      }
      this.map.infoWindow.hide();
      // recreate the attr inspector if needed
      this._createAttributeInspector(this.config.editor.configInfos);
      if (feature) {

        /* BEGIN CHANGE - Handle multiple selected features */

        var selFeatures = lang.isArray(feature) ? feature : [feature];

        SelectionManager.getInstance().setSelection(featureLayer, selFeatures).then(lang.hitch(this, function () {
          var selectedFeatures = featureLayer.getSelectedFeatures();
          this.updateFeatures = selectedFeatures;
          if (this.updateFeatures.length > 0) {
            this._showTemplate(false);
          }
        }));

        /* END CHANGE */
      }
    },
    //Function from the feature action
    beginEditingByFeatures: function beginEditingByFeatures(features, featureLayer) {
      if (!featureLayer) {
        return;
      }
      if (!features) {
        return;
      }
      if (features.length === 0) {
        return;
      }
      this._createOverDef.then(lang.hitch(this, function () {
        this.feature_action_select(features, featureLayer);
      }));
      //if (this.loaded_state.get('loaded') === true) {
      //  this.feature_action_select(features, featureLayer);
      //}
      //else {
      //  this.loaded_state.watch("loaded", lang.hitch(this,function(name, oldValue, value){
      //    if (name === 'loaded' && value === true && oldValue === false) {
      //      this.feature_action_select(features, featureLayer);
      //    }
      //  }));
      //}
    },

    onReceiveData: function onReceiveData(name, widgetId, data, historyData) {
      if (this.config.editor) {
        historyData = historyData;
        widgetId = widgetId;
        if (this.config.editor.hasOwnProperty("listenToGF")) {
          if (this.config.editor.listenToGF !== true) {
            return;
          }
        } else {
          return;
        }

        /* ------------------------------------------------------------- 
          CHANGE ECAN 2017-05-29 - addition of EditFilter to Listener 
        if (name !== 'GroupFilter') {
          return;
        }
        */

        if (name !== 'GroupFilter' && name !== 'EditFilter') {
          return;
        }

        /* ----------- END OF CHANGE 2017-05-29 ---------------------- */

        if (data.message.hasOwnProperty("fields") && data.message.hasOwnProperty("values")) {
          array.forEach(data.message.fields, function (field) {
            this._setPresetValueValue(field, data.message.values[0]);
          }, this);
        }
      }
    },
    /*jshint unused:true */
    _setTheme: function _setTheme() {
      //if (this.appConfig.theme.name === "BoxTheme" ||
      //    this.appConfig.theme.name === "DartTheme" ||
      //    this.appConfig.theme.name === "LaunchpadTheme") {
      var styleLink;
      if (this.appConfig.theme.name === "DartTheme") {
        utils.loadStyleLink('dartOverrideCSS', this.folderUrl + "/css/dartTheme.css", null);
      } else {
        styleLink = document.getElementById("dartOverrideCSS");
        if (styleLink) {
          styleLink.disabled = true;
        }
      }
      if (this.appConfig.theme.name === "LaunchpadTheme") {
        utils.loadStyleLink('launchpadOverrideCSS', this.folderUrl + "/css/launchpadTheme.css", null);
      } else {
        styleLink = document.getElementById("launchpadOverrideCSS");
        if (styleLink) {
          styleLink.disabled = true;
        }
      }
    },
    _mapClickHandler: function _mapClickHandler(create) {
      if (create === true && this._attrInspIsCurrentlyDisplayed === false) {
        this.map.setInfoWindowOnClick(false);
        if (this._mapClick === undefined || this._mapClick === null) {
          this._mapClick = on(this.map, "click", lang.hitch(this, this._onMapClick));
        }
        //this._activateTemplateToolbar();
      } else if (create === true && this._attrInspIsCurrentlyDisplayed === true) {
        if (this._mapClick) {
          this._mapClick.remove();
          this._mapClick = null;
        }
        this.map.setInfoWindowOnClick(true);
        //this._validateAttributes();
      } else {
        if (this._mapClick) {

          this._mapClick.remove();
          this._mapClick = null;
        }
        this.map.setInfoWindowOnClick(true);
        if (this.drawToolbar) {
          //this._lastDrawnShape = lang.clone(this.drawToolbar._points);
          this.drawToolbar.deactivate();
        }
      }
    },
    destroy: function destroy() {
      this.inherited(arguments);

      if (this.attrInspector) {
        this.attrInspector.destroy();
      }
      this.attrInspector = null;

      if (this.templatePicker) {
        this.templatePicker.destroy();
      }
      this.templatePicker = null;
      if (this.currentDrawType) {
        this.currentDrawType = null;
      }
      if (this._menus !== null && this._menus !== undefined) {
        for (var property in SEDrawingOptions) {
          if (this._menus.hasOwnProperty(property)) {
            if (this._menus[property] !== null && this._menus[property] !== undefined) {
              this._menus[property].destroyRecursive(false);
            }
          }
        }
        this._menus = {};
      }
      if (this.drawingTool !== null && this.drawingTool !== undefined) {
        this.drawingTool.destroyRecursive(false);
        this.drawingTool = null;
      }
      this._enableFeatureReduction();

      /* BEGIN: Ecan Changes */

      this._mapAddRemoveLayerHandler(false);

      /* END: Ecan Changes */

      this.inherited(arguments);
    },
    onActive: function onActive() {
      if (this._userHasPrivilege === true) {
        if (domClass.contains(this.widgetActiveIndicator, "widgetNotActive")) {
          domClass.remove(this.widgetActiveIndicator, "widgetNotActive");
        }
        domClass.add(this.widgetActiveIndicator, "widgetActive");
        if (this.map) {
          this._disableFeatureReduction();
          this._mapClickHandler(true);
          if (this._attrInspIsCurrentlyDisplayed === false) {
            var override = null;
            if (this.drawingTool && this.currentDrawType) {
              override = this.currentDrawType;
            }
            this._activateTemplateToolbar(override);
          }
        }
      }
    },
    _enableFeatureReduction: function _enableFeatureReduction() {
      if (this.clusterState === false) {
        array.forEach(this.featureReductionEnabledLayers, function (layer) {
          if (layer._layerRenderer) {
            layer.setRenderer(layer._layerRenderer);
          }
          layer.enableFeatureReduction();
          //layer.redraw();
        });
        this.clusterState = true;
      }
    },
    _disableFeatureReduction: function _disableFeatureReduction() {
      if (this.clusterState === true) {
        array.forEach(this.featureReductionEnabledLayers, function (layer) {
          if (layer._serviceRendererJson) {
            layer.setRenderer(rendererJsonUtils.fromJson(layer._serviceRendererJson));
          }
          layer.disableFeatureReduction();
          //layer.redraw();
        });
        this.clusterState = false;
      }
    },
    onDeActive: function onDeActive() {
      /* BEGIN: ECAN CHANGE - handle bug when widget is made inactive while edit tools are in process */

      if (this._attrInspIsCurrentlyDisplayed) {
        if (this.map.infoWindow.isShowing) {
          this.map.infoWindow.hide();
        }

        if (this.config.editor.displayPromptOnSave && this._validateFeatureChanged()) {
          this._promptToResolvePendingEdit(true, null, true);
        } else {
          this._cancelEditingFeature(true);
        }

        this._removeLayerVisibleHandler();
      }

      /* END: ECAN CHANGE */

      if (domClass.contains(this.widgetActiveIndicator, "widgetActive")) {
        domClass.remove(this.widgetActiveIndicator, "widgetActive");
      }
      domClass.add(this.widgetActiveIndicator, "widgetNotActive");
      if (this.map) {
        this._mapClickHandler(false);
      }
      this._enableFeatureReduction();
    },

    onOpen: function onOpen() {
      console.log('SmartEditorEcan::onOpen');
      if (this._userHasPrivilege === true) {
        //this.fetchDataByName('GroupFilter');
        this._workBeforeCreate();
        this.widgetManager.activateWidget(this);
      }
      if (this.templatePicker) {
        this.templatePicker.update();
      }
    },

    _initControl: function _initControl(operLayerInfos) {
      this._userHasPrivilege = true;
      this._jimuLayerInfos = operLayerInfos;
      var onlyConfiged = false;
      if (this.config.editor && this.config.editor.layerInfos) {
        onlyConfiged = this.config.editor.layerInfos.length > 0;
      }
      this.config.editor.configInfos = editUtils.getConfigInfos(this._jimuLayerInfos, this.config.editor.layerInfos, true, onlyConfiged);
      if (onlyConfiged === false) {
        array.forEach(this.config.editor.configInfos, function (configInfo) {
          configInfo._editFlag = true;
        });
      }
      if (this.config.editor.configInfos === undefined || this.config.editor.configInfos === null) {
        return false;
      } else if (this.config.editor.configInfos.length === 0) {
        return false;
      }
      this._processConfig();
      array.forEach(this.config.editor.configInfos, function (configInfo) {
        configInfo.featureLayer.name = configInfo.layerInfo.title;
        var layer = configInfo.featureLayer;

        //disable clustering
        if (layer.isFeatureReductionEnabled()) {
          var layerRenderer = layer.renderer;
          var layerRendererJson = layerRenderer.toJson();
          var serviceDefJson = JSON.parse(layer._json);
          var serviceRendererJson = serviceDefJson.drawingInfo.renderer;
          if (!utils.isEqual(layerRendererJson, serviceRendererJson)) {
            layer._layerRenderer = layerRenderer;
            layer._serviceRendererJson = serviceRendererJson;
          }
          this.featureReductionEnabledLayers.push(layer);
        }
      }, this);
      this._disableFeatureReduction();
      if (this.config.editor.hasOwnProperty("autoSaveEdits")) {
        if (this.config.editor.autoSaveEdits) {
          this._autoSaveRuntime = this.config.editor.autoSaveEdits;
          if (this._autoSaveRuntime) {
            registry.byId("autoSaveSwitch").set('checked', true);
          } else {
            registry.byId("autoSaveSwitch").set('checked', false);
          }
        }
      } else {
        this.config.editor.autoSaveEdits = false;
      }
      //array.forEach(this.featureReductionEnabledLayers, function (layer) {
      //  layer.disableFeatureReduction();
      //});
      this._createEditor();
      this.fetchDataByName('GroupFilter');

      /* BEGIN: CHANGE ECAN - Call to EditFilter widget */
      this.fetchDataByName('EditFilter');
      /* END: CHANGE ECAN */

      this.widgetManager.activateWidget(this);
      this._createOverDef.resolve();
      //this.loaded_state.set("loaded", true);
      return true;
    },
    _addFilterEditor: function _addFilterEditor(layers) {
      if (this.config.editor.useFilterEditor === true && this.templatePicker) {
        if (this._filterEditor) {
          this._filterEditor.setTemplatePicker(this.templatePicker, layers);
        } else {
          this._filterEditorNode = domConstruct.create("div", {});
          this.templatePickerDiv.insertBefore(this._filterEditorNode, this.templatePicker.domNode);
          this._filterEditor = new SEFilterEditor({
            _templatePicker: this.templatePicker,
            _layers: layers,
            map: this.map,
            nls: this.nls
          }, this._filterEditorNode);
        }
      }
    },
    _activateEditToolbar: function _activateEditToolbar(feature) {
      var layer = feature.getLayer();
      if (this.editToolbar.getCurrentState().tool !== 0) {
        this.editToolbar.deactivate();
      }
      switch (layer.geometryType) {
        case "esriGeometryPoint":
          this.editToolbar.activate(Edit.MOVE, feature);
          break;
        case "esriGeometryPolyline":
        case "esriGeometryPolygon":
          /*jslint bitwise: true*/
          this.editToolbar.activate(Edit.EDIT_VERTICES | Edit.MOVE | Edit.ROTATE | Edit.SCALE, feature);
          /*jslint bitwise: false*/
          break;
      }
    },
    _polygonToPolyline: function _polygonToPolyline(polygon) {
      var polyline = new Polyline();
      array.forEach(polygon.rings, function (ring) {
        polyline.addPath(ring);
        //array.forEach(ring, function (part) {
        //  polyline.addPath(part);
        //});
      });
      polyline.spatialReference = polygon.spatialReference;
      return polyline;
    },
    // this function also create a new attribute inspector for the local layer
    _addGraphicToLocalLayer: function _addGraphicToLocalLayer(evt) {
      if (this.templatePicker === undefined || this.templatePicker === null) {
        return;
      }
      if (!this.templatePicker.getSelected()) {
        return;
      }
      var selectedTemp = this.templatePicker.getSelected();
      var newTempLayerInfos;
      var localLayerInfo = null;

      if (this.attrInspector) {
        this.attrInspector.destroy();
        this.attrInspector = null;
      }

      if (this._attachmentUploader && this._attachmentUploader !== null) {
        this._attachmentUploader.clear();
      }

      this._removeLocalLayers();
      // preparation for a new attributeInspector for the local layer

      this.cacheLayer = this._cloneLayer(this.templatePicker.getSelected().featureLayer);
      this.cacheLayer.setSelectionSymbol(this._getSelectionSymbol(this.cacheLayer.geometryType, true));

      localLayerInfo = this._getLayerInfoForLocalLayer(this.cacheLayer);
      newTempLayerInfos = [localLayerInfo]; //this._converConfiguredLayerInfos([localLayerInfo]);

      this._createAttributeInspector([localLayerInfo]);

      if (this.config.editor.hasOwnProperty("editGeometryDefault") && this.config.editor.editGeometryDefault === true) {
        setTimeout(lang.hitch(this, function () {
          this._editGeomSwitch.set('checked', true);
        }), 100);
      }

      var newAttributes = lang.clone(selectedTemp.template.prototype.attributes);
      if (this._usePresetValues) {
        this._modifyAttributesWithPresetValues(newAttributes, newTempLayerInfos[0]);
      }

      if (this.cacheLayer.geometryType === "esriGeometryPolyline" && evt.geometry.type === 'polygon') {
        evt.geometry = this._polygonToPolyline(evt.geometry);
      }
      var newGraphic = new Graphic(evt.geometry, null, newAttributes);
      // store original attrs for later use
      newGraphic.preEditAttrs = JSON.parse(JSON.stringify(newGraphic.attributes));
      this.cacheLayer.applyEdits([newGraphic], null, null, lang.hitch(this, function (e) {
        var queryTask = new Query();
        queryTask.objectIds = [e[0].objectId];
        this.cacheLayer.selectFeatures(queryTask, FeatureLayer.SELECTION_NEW);

        this.currentFeature = this.updateFeatures[0] = newGraphic;
        this.getConfigDefaults();
        this.geometryChanged = false;
        //this._editGeomSwitch.set('checked', true);
        if (this._attributeInspectorTools) {
          this._attributeInspectorTools.triggerFormValidation();
        }
        this._attachLayerHandler();
        this.currentLayerInfo = this._getLayerInfoByID(this.currentFeature._layer.id);
        this.currentLayerInfo.isCache = true;
        this._toggleDeleteButton(false);
        //this._toggleEditGeoSwitch(false);

        //this._createSmartAttributes();
        //
        this._enableAttrInspectorSaveButton(this._validateAttributes());
      }));

      this._showTemplate(false, false);

      if (this.config.editor.hasOwnProperty("autoSaveEdits") && this._autoSaveRuntime === true) {
        setTimeout(lang.hitch(this, function () {
          var saveBtn = query(".saveButton")[0];
          if (!saveBtn) {
            //do nothing
          } else {
            on.emit(saveBtn, 'click', { cancelable: true, bubbles: true });
          }
        }), 100);
      }
    },

    // cancel editing of the current feature
    _cancelEditingFeature: function _cancelEditingFeature(showTemplatePicker) {
      if (!this.currentFeature) {
        return;
      }

      if (showTemplatePicker) {

        this._showTemplate(true, false);
      } else {
        // show attr inspector

        // restore attributes & geometry
        if (this.currentFeature.preEditAttrs) {
          this.currentFeature.attributes = JSON.parse(JSON.stringify(this.currentFeature.preEditAttrs));
        }
        if (this.currentFeature.origGeom) {
          this.currentFeature.geometry = geometryJsonUtil.fromJson(this.currentFeature.origGeom);
        }
        this.currentFeature.getLayer().refresh();
        this.attrInspector.refresh();

        //reset
        this._resetEditingVariables();
      }
    },

    _addDateFormat: function _addDateFormat(fieldInfo) {
      if (fieldInfo && fieldInfo.format && fieldInfo.format !== null) {
        if (fieldInfo.format.dateFormat && fieldInfo.format.dateFormat !== null) {
          if (fieldInfo.format.dateFormat.toString().toUpperCase().indexOf("TIME") >= 0) {
            fieldInfo.format.time = true;
          }
          //if (fieldInfo.format.dateFormat ===
          //  "shortDateShortTime" ||
          //  fieldInfo.format.dateFormat ===
          //  "shortDateLongTime" ||
          //  fieldInfo.format.dateFormat ===
          //  "shortDateShortTime24" ||
          //  fieldInfo.format.dateFormat ===
          //  "shortDateLEShortTime" ||
          //  fieldInfo.format.dateFormat ===
          //  "shortDateLEShortTime24" ||
          //  fieldInfo.format.dateFormat ===
          //  "shortDateLELongTime" ||
          //  fieldInfo.format.dateFormat ===
          //  "shortDateLELongTime24") {
          //  fieldInfo.format.time = true;
          //}
        }
      }
    },

    _processLayerFields: function _processLayerFields(fields) {
      //Function required to add the Range details to a range domain so the layer can be cloned

      array.forEach(fields, function (field) {
        if (field.domain !== undefined && field.domain !== null) {
          if (field.domain.type !== undefined && field.domain.type !== null) {
            if (field.domain.type === 'range') {
              if (field.domain.hasOwnProperty('range') === false) {
                field.domain.range = [field.domain.minValue, field.domain.maxValue];
              }
            }
          }
        }
      });

      return fields;
    },
    _iterateCollection: function _iterateCollection(collection) {
      return function (f) {
        for (var i = 0; collection[i]; i++) {
          f(collection[i], i);
        }
      };
    },
    _cloneLayer: function _cloneLayer(layer) {
      var cloneFeaturelayer;
      var fieldsproc = this._processLayerFields(layer.fields);
      var featureCollection = {
        layerDefinition: {
          "id": 0,
          "name": layer.name + this.nls.editorCache,
          "type": "Feature Layer",
          "displayField": layer.displayField,
          "description": "",
          "copyrightText": "",
          "relationships": [],
          "geometryType": layer.geometryType,
          "minScale": 0,
          "maxScale": 0,
          "extent": layer.fullExtent,
          "drawingInfo": {
            "renderer": layer.renderer,
            "transparency": 0,
            "labelingInfo": null
          },
          "hasAttachments": layer.hasAttachments,
          "htmlPopupType": "esriServerHTMLPopupTypeAsHTMLText",
          "objectIdField": layer.objectIdField,
          "globalIdField": layer.globalIdField,
          "typeIdField": layer.typeIdField,
          "fields": fieldsproc,
          "types": layer.types,
          "templates": layer.templates,
          "capabilities": "Create,Delete,Query,Update,Uploads,Editing",
          "editFieldsInfo": layer.editFieldsInfo === undefined ? null : layer.editFieldsInfo
        }
      };
      var outFields = layer.fields.map(function (f) {
        return f.name;
      });
      // only keep one local layer
      //var existingLayer = this.map.getLayer(layer.id + "_lfl");
      //if (existingLayer) {
      //  this.map.removeLayer(existingLayer);
      //}

      this._eventHandler = this.own(on(layer, "visibility-change", lang.hitch(this, function () {
        setTimeout(lang.hitch(this, function () {
          var cancelBtn = query(".cancelButton")[0];
          if (!cancelBtn) {
            //do nothing
          } else {
            on.emit(cancelBtn, 'click', { cancelable: true, bubbles: true });
          }
        }), 100);
      })));

      cloneFeaturelayer = new FeatureLayer(featureCollection, {
        id: layer.id + "_lfl",
        outFields: outFields
      });
      cloneFeaturelayer.visible = true;
      cloneFeaturelayer.renderer = layer.renderer;
      cloneFeaturelayer.originalLayerId = layer.id;
      cloneFeaturelayer._wabProperties = { isTemporaryLayer: true };
      this.map.addLayer(cloneFeaturelayer);
      return cloneFeaturelayer;
    },
    _endsWith: function _endsWith(str, suffix) {
      return str.indexOf(suffix, str.length - suffix.length) !== -1;
    },
    _validateEventHandler: function _validateEventHandler() {
      this._enableAttrInspectorSaveButton(this._validateAttributes());
    },
    _validateAttributes: function _validateAttributes() {
      var rowsWithGDBRequiredFieldErrors = this._validateRequiredFields();
      var featureHasEdits = this._validateFeatureChanged();

      var rowsWithSmartErrors = [];
      var formValid = true;
      if (this._smartAttributes !== undefined) {
        if (this._smartAttributes !== null) {
          rowsWithSmartErrors = this._smartAttributes.toggleFields();
        }
      }
      if (this._attributeInspectorTools !== undefined) {
        if (this._attributeInspectorTools !== null) {
          formValid = this._attributeInspectorTools.formValid();
        }
      }
      return editUtils.isObjectEmpty(rowsWithGDBRequiredFieldErrors) && rowsWithSmartErrors.length === 0 && formValid && featureHasEdits;
    },
    _toggleEditGeoSwitch: function _toggleEditGeoSwitch(disable) {
      if (this._editGeomSwitch === undefined || this._editGeomSwitch === null) {
        return;
      }
      if (disable === false) {
        dojo.style(this._editGeomSwitch.domNode.parentNode, "display", "block");
        this._turnEditGeometryToggleOff();
      } else {
        dojo.style(this._editGeomSwitch.domNode.parentNode, "display", "none");
        this._turnEditGeometryToggleOff();
      }
    },
    _recordLoadeAttInspector: function _recordLoadeAttInspector() {
      if (this.editDescription.style.display === "block") {
        if (this.updateFeatures.length > 1) {
          dojo.style(this.editDescription, "padding-top", "20px");
        } else {
          dojo.style(this.editDescription, "padding-top", "0");
        }
      } else {
        if (this.updateFeatures.length > 1) {
          dojo.style(query(".attributeInspectorDiv")[0], "padding-top", "20px");
        } else {
          dojo.style(query(".attributeInspectorDiv")[0], "padding-top", "8px");
        }
      }
      this.getConfigDefaults();
    },
    editGeoCheckChange: function editGeoCheckChange() {
      return function () {
        this._editGeometry(this._editGeomSwitch.checked);
      };
    },

    _attributeInspectorChangeRecord: function _attributeInspectorChangeRecord(evt) {
      //this._turnEditGeometryToggleOff();

      if (this._validateFeatureChanged() && this.currentFeature) {
        // do not show templatePicker after saving
        if (this.config.editor.displayPromptOnSave && this.config.editor.displayPromptOnSave === true) {
          this._promptToResolvePendingEdit(false, evt, false, true);
        }
      } else {
        this._postFeatureSave(evt);
      }
      this._recordLoadeAttInspector();
    },
    _addWarning: function _addWarning() {
      if (query(".attwarning").length === 0) {
        var txt = domConstruct.create("div", { 'class': 'attwarning' });
        txt.innerHTML = this.nls.attachmentSaveDeleteWarning;
        if (this.attrInspector._attachmentEditor !== undefined && this.attrInspector._attachmentEditor !== null) {
          this.attrInspector._attachmentEditor.domNode.appendChild(txt);
        }
      }
    },
    _createAttributeInspector: function _createAttributeInspector(layerInfos) {

      //destroy the edit geom switch
      if (this._editGeomSwitch) {
        this._editGeomSwitch.destroy();
        this._editGeomSwitch = null;
      }

      if (this.editSwitchDiv) {
        while (this.editSwitchDiv.firstChild) {
          this.editSwitchDiv.removeChild(this.editSwitchDiv.firstChild);
        }
      }

      if (this.attrInspector) {
        this.attrInspector.destroy();
        this.attrInspector = null;
      }
      this.attrInspector = editUtils.ATI({ //new AttributeInspector({
        layerInfos: layerInfos
      }, html.create("div", {
        style: {
          width: "100%",
          height: "100%"
        }
      }));
      this.attrInspector.placeAt(this.attributeInspectorNode);
      this.attrInspector.startup();
      domConstruct.place(this.attrInspector.navMessage, this.attrInspector.nextFeatureButton.domNode, "before");

      this.editSwitchDiv = domConstruct.create("div");
      this.editSwitchDiv.appendChild(domConstruct.create("div", { "class": "spacer" }));
      // edit geometry toggle button
      this._editGeomSwitch = new CheckBox({
        id: "editGeometrySwitch",
        checked: false,
        value: this.nls.editGeometry
      }, null);

      this.editSwitchDiv.appendChild(this._editGeomSwitch.domNode);

      domConstruct.place(lang.replace("<label for='editGeometrySwitch'>{replace}</label></br></br>", { replace: this.nls.editGeometry }), this._editGeomSwitch.domNode, "after");

      domConstruct.place(this.editSwitchDiv, this.attrInspector.deleteBtn.domNode, "before");

      this.own(on(this._editGeomSwitch, 'Change', lang.hitch(this, this.editGeoCheckChange())));

      //add close/cancel/switch to template button
      var cancelButton = domConstruct.create("div", {
        innerHTML: this.nls.back,
        "class": "cancelButton jimu-btn"
      }, this.attrInspector.deleteBtn.domNode, "after");

      // save button
      var saveButton = domConstruct.create("div", {
        innerHTML: this.nls.save,
        "class": "saveButton jimu-btn jimu-state-disabled"
      }, cancelButton, "after");

      //add another process indicator
      //domConstruct.create("div", {
      //  "class": "processing-indicator"
      //}, saveButton, "before");
      if (query(".jimu-widget-smartEditor-ecan .deleteButton").length < 1) {
        this._deleteButton = domConstruct.create("div", {
          innerHTML: this.nls.deleteText,
          "class": "deleteButton jimu-btn jimu-btn-vacation"
        }, saveButton, "after");
        // query(".jimu-widget-smartEditor-ecan .topButtonsRowDiv")[0], "first");

        on(this._deleteButton, "click", lang.hitch(this, function () {
          //if (this.currentFeature) {
          if (this.map.infoWindow.isShowing) {
            this.map.infoWindow.hide();
          }

          if (this.config.editor.displayPromptOnDelete) {
            this._promptToDelete();
          } else {
            this._deleteFeature();
          }
          //}
        }));
      }

      //wire up the button events
      this.own(on(cancelButton, "click", lang.hitch(this, function () {
        if (this.map.infoWindow.isShowing) {
          this.map.infoWindow.hide();
        }

        if (this.config.editor.displayPromptOnSave && this._validateFeatureChanged()) {
          this._promptToResolvePendingEdit(true, null, true);
        } else {
          this._cancelEditingFeature(true);
          //this._activateTemplateToolbar();
        }

        this._removeLayerVisibleHandler();
      })));

      this.own(on(saveButton, "click", lang.hitch(this, function () {
        if (!this._validateFeatureChanged()) {
          this._resetEditingVariables();
          return;
        }

        if (this.map.infoWindow.isShowing) {
          this.map.infoWindow.hide();
        }
        this._saveEdit(this.currentFeature);
      })));

      // edit geometry checkbox event

      // attribute inspector events
      this.own(on(this.attrInspector, "attribute-change", lang.hitch(this, function (evt) {
        if (this.currentFeature) {
          this.currentFeature.attributes[evt.fieldName] = evt.fieldValue;
          this._enableAttrInspectorSaveButton(this._validateAttributes());
        }
      })));
      this.own(on(this.attrInspector, "next", lang.hitch(this, function (evt) {

        this._attributeInspectorChangeRecord(evt);
        this._addWarning();
      })));
      if (this._attachmentUploader && this._attachmentUploader !== null) {
        this._attachmentUploader.destroy();
        this._attachmentUploader = null;
      }
      if (layerInfos.length === 1) {
        if (layerInfos[0].featureLayer.hasOwnProperty('originalLayerId')) {
          var result = this._getLayerInfoByID(layerInfos[0].featureLayer.originalLayerId);
          if (result.featureLayer.hasAttachments === true) {
            this.attachNode = domConstruct.create("div");
            domConstruct.place(this.attachNode, this.attrInspector.attributeTable, "after");
            this._attachmentUploader = new AttachmentUploader({ 'class': 'atiAttachmentEditor' }, this.attachNode);
            this._attachmentUploader.startup();
          }
        }
      }
    },
    _toggleDeleteButton: function _toggleDeleteButton(show) {
      if (show === true) {
        this._deleteButton.style.display = "block";
      } else {
        this._deleteButton.style.display = "none";
      }
    },

    _activateTemplateToolbar: function _activateTemplateToolbar(override) {

      /* BEGIN: Ecan Changes - Handling draw tool use by edit tools for cut, reshape */

      this._drawToolEditMode = false;

      /* END: Ecan Changes */

      var draw_type = override || null;
      var shape_type = null;
      if (this.templatePicker) {
        var selectedTemplate = this.templatePicker.getSelected();
        if (selectedTemplate && selectedTemplate !== null) {
          shape_type = selectedTemplate.featureLayer.geometryType;
          if (selectedTemplate.template !== undefined && selectedTemplate.template !== null && selectedTemplate.template.drawingTool !== undefined && selectedTemplate.template.drawingTool !== null) {
            switch (selectedTemplate.template.drawingTool) {
              case "esriFeatureEditToolNone":
                switch (selectedTemplate.featureLayer.geometryType) {
                  case "esriGeometryPoint":
                    draw_type = draw_type !== null ? draw_type : Draw.POINT;
                    break;
                  case "esriGeometryPolyline":
                    draw_type = draw_type !== null ? draw_type : Draw.POLYLINE;
                    break;
                  case "esriGeometryPolygon":
                    draw_type = draw_type !== null ? draw_type : Draw.POLYGON;
                    break;
                }
                break;
              case "esriFeatureEditToolPoint":
                draw_type = draw_type !== null ? draw_type : Draw.POINT;
                break;
              case "esriFeatureEditToolLine":
                draw_type = draw_type !== null ? draw_type : Draw.POLYLINE;
                break;
              case "esriFeatureEditToolAutoCompletePolygon":
              case "esriFeatureEditToolPolygon":
                draw_type = draw_type !== null ? draw_type : Draw.POLYGON;
                break;
              case "esriFeatureEditToolCircle":
                draw_type = draw_type !== null ? draw_type : Draw.CIRCLE;
                break;
              case "esriFeatureEditToolEllipse":
                draw_type = draw_type !== null ? draw_type : Draw.ELLIPSE;
                break;
              case "esriFeatureEditToolRectangle":
                draw_type = draw_type !== null ? draw_type : Draw.RECTANGLE;
                break;
              case "esriFeatureEditToolFreehand":
                switch (selectedTemplate.featureLayer.geometryType) {
                  case "esriGeometryPoint":
                    draw_type = draw_type !== null ? draw_type : Draw.POINT;
                    break;
                  case "esriGeometryPolyline":
                    draw_type = draw_type !== null ? draw_type : Draw.FREEHAND_POLYLINE;
                    break;
                  case "esriGeometryPolygon":
                    draw_type = draw_type !== null ? draw_type : Draw.FREEHAND_POLYGON;
                    break;
                }
                break;
              default:
                switch (selectedTemplate.featureLayer.geometryType) {
                  case "esriGeometryPoint":
                    draw_type = draw_type !== null ? draw_type : Draw.POINT;
                    break;
                  case "esriGeometryPolyline":
                    draw_type = draw_type !== null ? draw_type : Draw.POLYLINE;
                    break;
                  case "esriGeometryPolygon":
                    draw_type = draw_type !== null ? draw_type : Draw.POLYGON;
                    break;
                }
                break;
            }
          } else {
            switch (selectedTemplate.featureLayer.geometryType) {
              case "esriGeometryPoint":
                draw_type = draw_type !== null ? draw_type : Draw.POINT;
                break;
              case "esriGeometryPolyline":
                draw_type = draw_type !== null ? draw_type : Draw.POLYLINE;
                break;
              case "esriGeometryPolygon":
                draw_type = draw_type !== null ? draw_type : Draw.POLYGON;
                break;
            }
          }
          this.drawToolbar.activate(draw_type);
          this._setDrawingToolbar(shape_type, draw_type);
        } else if (this.drawToolbar) {
          this._setDrawingToolbar("select", null);
          this.drawToolbar.deactivate();
          // this._lastDrawnShape = null;
        }
      } else if (this.drawToolbar) {
        this._setDrawingToolbar("select", null);
        this.drawToolbar.deactivate();
        //this._lastDrawnShape = null;
      }
    },
    _templatePickerNeedsToBeCreated: function _templatePickerNeedsToBeCreated() {
      //if (this.templatePicker === undefined || this.templatePicker === null) {
      //  return true;
      //}
      return true;
      //var recreate = array.some(layers, function (layer) {
      //  var layerMatches = array.some(this.templatePicker.featureLayers, function (tpLayer) {
      //    return tpLayer.id === layer.id;
      //  });
      //  if (layerMatches === false) {
      //    return true;
      //  }
      //  return false;
      //}, this);
      //return recreate;
    },
    _layerChangeOutside: function _layerChangeOutside() {
      if (this._attrInspIsCurrentlyDisplayed && this._attrInspIsCurrentlyDisplayed === true) {
        if (this.attrInspector) {
          if (this.attrInspector._numFeatures === 0) {
            this._showTemplate(true);
          }
        }
      }
    },
    _drawingToolClick: function _drawingToolClick(shapeType, options) {
      return function () {
        if (shapeType !== "select") {
          /* BEGIN: Ecan Change - Check for a select method so we can disable the map info popup */
          if (options.label.indexOf(window.apiNls.widgets.editor.tools.NLS_selectionNewLbl) >= 0) {
            this._mapClickHandler(false);
            this.map.setInfoWindowOnClick(false);
          }
          /* END: ECan Change  */

          this.drawingTool.set('label', options.label);
          this.drawingTool.set('iconClass', options.iconClass);
          this.drawToolbar.activate(options._drawType);
          this.currentDrawType = options._drawType;
          this.currentShapeType = shapeType;
        }
      };
    },
    _menus: {},
    drawingTool: null,
    _setDrawingToolbar: function _setDrawingToolbar(shapeType, drawType) {
      if (this.drawingTool === null || this.drawingTool === undefined) {
        return;
      }
      if (this.currentShapeType === null || this.currentShapeType === undefined || this.currentShapeType !== shapeType) {
        this.drawingTool.set('dropDown', this._menus[shapeType]);
      }

      this.currentShapeType = shapeType;

      this.currentDrawType = null;

      array.some(SEDrawingOptions[shapeType], function (options) {
        if (options._drawType === drawType || drawType === null) {
          this.drawingTool.set('label', options.label);
          this.drawingTool.set('iconClass', options.iconClass);
          this.currentDrawType = options._drawType;
          return true;
        } else {
          return false;
        }
      }, this);

      //if the proper type was not found, set to first
      if (this.currentDrawType === null || this.currentDrawType === undefined) {
        this.drawingTool.set('label', SEDrawingOptions[shapeType][0].label);
        this.drawingTool.set('iconClass', SEDrawingOptions[shapeType][0].iconClass);
        this.currentDrawType = SEDrawingOptions[shapeType][0]._drawType;
      }
    },
    _createDrawingToolbar: function _createDrawingToolbar() {

      if (this.config.editor.hasOwnProperty("displayShapeSelector")) {
        if (this.config.editor.displayShapeSelector === true) {
          this._menus = this._createDrawingMenus();
          this.drawingTool = new DropDownButton({
            label: "",
            name: "drawingTool",
            id: "drawingTool"
          }, this.drawingOptionsDiv);
          this.drawingTool.startup();
          this._setDrawingToolbar("select", null);
        }
      } else {
        this.config.editor.displayShapeSelector = false;
      }
    },
    _createMenu: function _createMenu(drawingOption) {
      var menu = new DropDownMenu({ style: "display: none;" });
      array.forEach(drawingOption, function (options) {

        options = lang.mixin(options, {
          onClick: lang.hitch(this, this._drawingToolClick(drawingOption, options))
        });
        var menuItem = new MenuItem(options);

        menu.addChild(menuItem);
      }, this);
      menu.startup();
      return menu;
    },
    _createDrawingMenus: function _createDrawingMenus() {
      var menus = {};
      for (var property in SEDrawingOptions) {
        menus[property] = this._createMenu(SEDrawingOptions[property]);
      }
      return menus;
    },
    _createEditor: function _createEditor() {
      var selectedTemplate = null;

      if (this.config.editor === undefined || this.config.editor === null) {
        return;
      }
      var layers = this._getEditableLayers(this.config.editor.configInfos, false);
      this._layerChangeOutside();
      if (layers.length < 1) {
        this._creationDisabledOnAll = true;
      } else if (this._templatePickerNeedsToBeCreated()) {
        if (this._attrInspIsCurrentlyDisplayed && this._attrInspIsCurrentlyDisplayed === true) {
          this._recreateOnNextShow = true;
          return;
        }
        if (this.templatePicker && this.templatePicker !== null) {
          //Get the current selected drawing tool to reset on template
          var curSelectedDrawOption = this.currentDrawType;
          selectedTemplate = this.templatePicker.getSelected();
          if (selectedTemplate === null) {
            if (this.drawToolbar) {

              this.drawToolbar.deactivate();
            }
          }
          this._select_change_event.remove();
          this.templatePicker.destroy();
          this._resetEditingVariables();
          if (this.drawToolbar) {
            this.drawToolbar.deactivate();
          }
          if (this.drawingTool) {
            this._setDrawingToolbar("select", null);
          }
        } else {
          this._createAutoSaveSwitch(this.config.editor.autoSaveEdits);
          this._createPresetTable(layers, this.config.editor.configInfos);

          /* BEGIN: ECAN CHANGE - Init URL Preset Values */

          this._initURLPresetValues();

          /* END: ECAN CHANGE */
        }
        //create template picker
        this.templatePickerNode = domConstruct.create("div", { 'class': "eeTemplatePicker" });
        //if (this.state === "active") {
        //  this.widgetActiveIndicator = domConstruct.create("div",
        //   { 'class': "widgetActive" }
        //   );
        //}
        //else {
        //  this.widgetActiveIndicator = domConstruct.create("div",
        //  { 'class': "widgetNotActive" }
        //  );
        //}
        this.templatePickerDiv.appendChild(this.templatePickerNode);
        this.templatePicker = new TemplatePicker({
          featureLayers: layers,
          'class': 'esriTemplatePicker',
          grouping: true,
          maxLabelLength: "25",
          showTooltip: false
        }, this.templatePickerNode);
        this.templatePicker.startup();

        //this.templatePicker.domNode.appendChild(this.widgetActiveIndicator);
        //this.templatePickerNode.appendChild(this.templatePicker.domNode);
        this._addFilterEditor(layers);

        /* BEGIN: ECAN CHANGE - Look for and apply url parameter template filters */

        this._applyURLTemplateFilter();

        /* END: ECAN CHANGE */

        // wire up events

        if (selectedTemplate !== null && this.templatePicker) {
          var keysArr = Object.getOwnPropertyNames(this.templatePicker._itemWidgets);
          var templateItems = [];
          array.forEach(this.templatePicker._flItems, function (flItems) {
            array.forEach(flItems, function (flItem) {
              templateItems.push(flItem);
            });
          });
          if (templateItems.length === keysArr.length) {
            var itemFnd = array.some(templateItems, function (item, index) {
              if (selectedTemplate.featureLayer.id === item.layer.id && item.template.name === selectedTemplate.template.name && item.template.drawingTool === selectedTemplate.template.drawingTool && item.template.description === selectedTemplate.template.description && item.type === selectedTemplate.type) {
                var dom = dojo.byId(keysArr[index]);
                on.emit(dom, "click", {
                  bubbles: true,
                  cancelable: true
                });
                this._activateTemplateToolbar(curSelectedDrawOption);
                return true;
              }
            }, this);

            if (itemFnd === false) {
              if (this.drawToolbar) {
                this.drawToolbar.deactivate();
              }
              if (this.drawingTool) {
                this._setDrawingToolbar("select", null);
              }
            }
          } else {
            if (this.drawToolbar) {
              this.drawToolbar.deactivate();
            }
            if (this.drawingTool) {
              this._setDrawingToolbar("select", null);
            }
          }
        } else {
          if (this.drawToolbar) {
            this.drawToolbar.deactivate();
          }
          if (this.drawingTool) {
            this._setDrawingToolbar("select", null);
          }
        }
        this._select_change_event = on(this.templatePicker, "selection-change", lang.hitch(this, this._template_change));
        this.own(this._select_change_event);
      }
      if (layers.length < 1) {
        this._creationDisabledOnAll = true;
      } else {
        this._creationDisabledOnAll = false;
      }
      if (this._creationDisabledOnAll) {
        if (this.drawToolbar) {
          this.drawToolbar.deactivate();
        }
        if (this.drawingTool) {
          this._setDrawingToolbar("select", null);
        }
        if (this.templatePicker) {
          dojo.style(this.templatePicker.domNode, "display", "none");
          if (this.config.editor.autoSaveEdits) {
            this._createAutoSaveSwitch(false);
          }
          //Clear the selected template and activate the map click
          this._mapClickHandler(true);
          this.templatePicker.clearSelection();
        }
        if (this.drawingTool) {
          dojo.style(this.drawingTool.domNode, "display", "none");
        }
        if (this._filterEditor) {
          dojo.style(this._filterEditor.domNode, "display", "none");
        }
      } else {
        if (this.templatePicker) {
          dojo.style(this.templatePicker.domNode, "display", "block");
        }
        if (this.config.editor.autoSaveEdits) {
          this._createAutoSaveSwitch(true);
        }
        if (this.drawingTool) {
          dojo.style(this.drawingTool.domNode, "display", "block");
        }
        if (this._filterEditor) {
          dojo.style(this._filterEditor.domNode, "display", "block");
        }
      }
    },
    isGuid: function isGuid(value) {
      if (value[0] === "{") {
        value = value.substring(1, value.length - 1);
      }
      var regexGuid = /^(\{){0,1}[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}(\}){0,1}$/gi;
      return regexGuid.test(value);
    },
    _template_change: function _template_change() {

      this.currentDrawType = null;
      this.currentShapeType = null;
      this._activateTemplateToolbar();
    },
    validateGUID: function validateGUID(value, constraints) {
      constraints = constraints;
      return this.isGuid(value);
    },
    _createPresetTable: function _createPresetTable(layers, layerInfos) {
      // set preset values table
      var editLayerInfos = layerInfos; //this._getEditableLayersInfos(layerInfos)
      if (layers.length > 0 && this._hasPresetValueFields(editLayerInfos)) {
        this._initPresetFieldsTable();
        this._fillPresetValueTable(editLayerInfos);

        /* BEGIN: CHANGE ECAN - Hide presets but include in dom for system use */
        //query(".presetFieldsTableDiv")[0].style.display = "block";

        // TO - TIE TO HIDE CONFIG SETTING
        query(".presetFieldsTableDiv")[0].style.display = "none";
        /* EDN: CHANGE ECAN */
      } else {
        query(".presetFieldsTableDiv")[0].style.display = "none";
      }
    },
    _createPresetFieldContentNode: function _createPresetFieldContentNode(fieldInfo) {
      var nodes = [];
      var node;

      if (fieldInfo.domain) {
        // domain.type = codedValue
        if (fieldInfo.domain.type === "codedValue") {
          var domainValues = fieldInfo.domain.codedValues;

          var options = [];
          array.forEach(domainValues, function (dv) {
            options.push({ name: dv.name, id: dv.code });
          });

          node = new FilteringSelect({
            "class": "ee-inputField",
            name: fieldInfo.fieldName,
            store: new Memory({ data: options }),
            searchAttr: "name"
          }, domConstruct.create("div"));
        } else {
          //domain.type = range
          var cons = null;
          switch (fieldInfo.type) {
            case "esriFieldTypeSmallInteger":
            case "esriFieldTypeInteger":
              cons = {
                min: fieldInfo.domain.minValue,
                max: fieldInfo.domain.maxValue,
                places: 0
              };
              break;

            case "esriFieldTypeSingle":
            case "esriFieldTypeDouble":
              cons = {
                min: fieldInfo.domain.minValue,
                max: fieldInfo.domain.maxValue
              };
              break;

          }
          node = new NumberSpinner({
            "class": "ee-inputField",
            name: fieldInfo.fieldName,
            smallDelta: 1,
            constraints: cons
          }, domConstruct.create("div"));
        }

        nodes.push(node);
      } else {
        switch (fieldInfo.type) {
          case "esriFieldTypeGUID":
            node = new ValidationTextBox({
              "class": "ee-inputField",
              name: fieldInfo.fieldName
            }, domConstruct.create("div"));
            node.validator = lang.hitch(this, this.validateGUID);
            nodes.push(node);
            break;
          case "esriFieldTypeDate":
            node = new DateTextBox({
              "class": "ee-inputField",

              name: fieldInfo.fieldName
            }, domConstruct.create("div"));
            //value: new Date(),
            nodes.push(node);

            if (fieldInfo.format) {
              if (fieldInfo.format.time && fieldInfo.format.time === true) {
                var timeNode = new TimeTextBox({
                  "class": "ee-inputField",
                  "style": "margin-top:2px;"

                }, domConstruct.create("div"));
                nodes.push(timeNode);
                //value: new Date()
              }
            }

            break;
          case "esriFieldTypeString":
            var maxlength = null;
            if (fieldInfo.length && Number(fieldInfo.length) && Number(fieldInfo.length) > 0) {
              maxlength = fieldInfo.length;
            }
            if (fieldInfo.hasOwnProperty("stringFieldOption")) {
              if (fieldInfo.stringFieldOption === "richtext") {
                var params = {
                  'class': 'ee-inputField ee-inputFieldRichText',
                  trim: true,
                  maxLength: maxlength
                };
                params['class'] += ' atiRichTextField';
                params.height = '100%';
                params.width = '100%';
                params.name = fieldInfo.fieldName;
                params.plugins = ['bold', 'italic', 'underline', 'foreColor', 'hiliteColor', '|', 'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', '|', 'insertOrderedList', 'insertUnorderedList', 'indent', 'outdent', '|', 'createLink'];
                node = new Editor(params, domConstruct.create("div"));
                node.startup();
              } else if (fieldInfo.stringFieldOption === "textarea") {
                node = new SimpleTextarea({
                  "class": "ee-inputField ee-inputFieldTextArea",
                  name: fieldInfo.fieldName,
                  maxlength: maxlength
                }, domConstruct.create("div"));
              } else {
                node = new TextBox({
                  "class": "ee-inputField",
                  name: fieldInfo.fieldName,
                  maxlength: maxlength
                }, domConstruct.create("div"));
              }
            } else {
              node = new TextBox({
                "class": "ee-inputField",
                name: fieldInfo.fieldName,
                maxlength: maxlength
              }, domConstruct.create("div"));
            }
            nodes.push(node);
            break;
          // todo: check for more types
          case "esriFieldTypeSmallInteger":
          case "esriFieldTypeInteger":
            node = new NumberTextBox({
              "class": "ee-inputField",
              name: fieldInfo.fieldName,
              constraints: { places: 0 }
            }, domConstruct.create("div"));

            nodes.push(node);

            break;
          case "esriFieldTypeSingle":
          case "esriFieldTypeDouble":
            node = new NumberTextBox({
              "class": "ee-inputField",
              name: fieldInfo.fieldName
            }, domConstruct.create("div"));

            nodes.push(node);

            break;
          default:
            node = new TextBox({
              "class": "ee-unsupportField",
              name: fieldInfo.fieldName,
              value: "N/A",
              readOnly: true
            }, domConstruct.create("div"));
            nodes.push(node);
            break;
        }
      }
      array.forEach(nodes, function (node) {
        this.own(on(node, 'change', lang.hitch(this, this._presetChange)));
      }, this);
      return nodes;
    },
    _presetChange: function _presetChange() {
      this._toggleUsePresetValues(true);
    },
    _createAutoSaveSwitch: function _createAutoSaveSwitch(defaultState) {
      if (defaultState) {
        query(".autoSaveOptionDiv")[0].style.display = "block";
      } else {
        query(".autoSaveOptionDiv")[0].style.display = "none";
      }
    },
    _toggleRunTimeAutoSave: function _toggleRunTimeAutoSave() {
      if (this._autoSaveRuntime === false) {
        this._autoSaveRuntime = true;
      } else {
        this._autoSaveRuntime = false;
      }
      this._createAutoSaveSwitch(this.config.editor.autoSaveEdits);
    },
    _deleteFeature: function _deleteFeature() {
      if (!this.currentFeature) {
        return;
      }

      this._resetEditingVariables();

      var layer = this.currentFeature.getLayer();
      if (layer.url === null) {
        layer.clear();
        this._showTemplate(true);
      } else {
        var processIndicators = query(".processing-indicator");
        var processIndicatorsPanel = query(".processing-indicator-panel");
        var saveBtn = query(".saveButton")[0];
        array.forEach(processIndicators, function (processIndicator) {
          if (!domClass.contains(processIndicator, "busy")) {
            domClass.add(processIndicator, "busy");
          }
        });
        array.forEach(processIndicatorsPanel, function (processIndicator) {
          if (!domClass.contains(processIndicator, "busy")) {
            domClass.add(processIndicator, "busy");
          }
        });
        if (!domClass.contains(saveBtn, "hide")) {
          domClass.add(saveBtn, "hide");
        }

        layer.applyEdits(null, null, [this.currentFeature], lang.hitch(this, function (adds, updates, deletes) {
          adds = adds;
          updates = updates;
          if (deletes && deletes.length > 0 && deletes[0].hasOwnProperty("error")) {
            Message({
              message: deletes[0].error.toString()
            });
          } else {
            this.updateFeatures.splice(this.updateFeatures.indexOf(this.currentFeature), 1);

            if (this.updateFeatures && this.updateFeatures.length > 0) {
              this.attrInspector.refresh();
              this.attrInspector.first();
            } else {
              this._showTemplate(true);
            }
          }
          array.forEach(processIndicators, function (processIndicator) {
            if (domClass.contains(processIndicator, "busy")) {
              domClass.remove(processIndicator, "busy");
            }
          });
          array.forEach(processIndicatorsPanel, function (processIndicator) {
            if (domClass.contains(processIndicator, "busy")) {
              domClass.remove(processIndicator, "busy");
            }
          });
          if (domClass.contains(saveBtn, "hide")) {
            domClass.remove(saveBtn, "hide");
          }
        }), lang.hitch(this, function (err) {
          Message({
            message: err.message.toString() + "\n" + err.details
          });
          array.forEach(processIndicators, function (processIndicator) {
            if (domClass.contains(processIndicator, "busy")) {
              domClass.remove(processIndicator, "busy");
            }
          });
          array.forEach(processIndicatorsPanel, function (processIndicator) {
            if (domClass.contains(processIndicator, "busy")) {
              domClass.remove(processIndicator, "busy");
            }
          });
          if (domClass.contains(saveBtn, "hide")) {
            domClass.remove(saveBtn, "hide");
          }
        }));
      }
    },

    _editGeometry: function _editGeometry(checked) {
      if (this._ignoreEditGeometryToggle) {
        return;
      }

      if (checked === true) {
        this.map.setInfoWindowOnClick(false);

        if (this.map.infoWindow.isShowing) {
          this.map.infoWindow.hide();
        }

        if (this._editingEnabled === false) {
          this._editingEnabled = true;
          // store the original geometry for later use
          this.currentFeature.origGeom = this.currentFeature.geometry.toJson();
          this._activateEditToolbar(this.currentFeature);
        } else {
          if (this.editToolbar.getCurrentState().tool !== 0) {
            this.editToolbar.deactivate();
          }
          this._editingEnabled = false;
        }
      } else {
        this.map.setInfoWindowOnClick(true);
        if (this.editToolbar.getCurrentState().tool !== 0) {
          this.editToolbar.deactivate();
        }
        this._editingEnabled = false;
      }
    },

    _enableAttrInspectorSaveButton: function _enableAttrInspectorSaveButton(enable) {
      var saveBtn = query(".saveButton")[0];
      if (!saveBtn) {
        return;
      }

      if (enable) {
        if (domClass.contains(saveBtn, "jimu-state-disabled")) {
          domClass.remove(saveBtn, "jimu-state-disabled");
        }
      } else {
        if (!domClass.contains(saveBtn, "jimu-state-disabled")) {
          domClass.add(saveBtn, "jimu-state-disabled");
        }
      }
    },

    _getLayerInfoByID: function _getLayerInfoByID(id) {

      if (id.indexOf("_lfl") > 0) {
        id = id.replace("_lfl", "");
      }
      var result = null;
      this.config.editor.configInfos.some(function (configInfo) {
        return configInfo.featureLayer.id === id ? (result = configInfo, true) : false;
      });
      return result;
    },
    _changeFieldToMostRestrictive: function _changeFieldToMostRestrictive(existingField, newField) {

      if (newField.length && Number(newField.length) && Number(newField.length) > 0) {
        if (existingField.length && Number(existingField.length)) {
          if (newField.length < existingField.length) {
            existingField.length = newField.length;
          }
        } else {
          existingField.length = newField.length;
        }
      }
      if (existingField.type === newField.type) {
        switch (newField.type) {
          case "esriFieldTypeString":
            if (existingField.hasOwnProperty("stringFieldOption") && newField.hasOwnProperty("stringFieldOption")) {
              if (existingField.stringFieldOption === "richtext" && newField.stringFieldOption !== "richtext") {
                existingField.stringFieldOption = newField.stringFieldOption;
              } else if (existingField.stringFieldOption === "textarea" && newField.stringFieldOption === "textbox") {
                existingField.stringFieldOption = newField.stringFieldOption;
              }
            }
            break;
        }
      }
      //stubbed out code to change preset to most restrictive value
      //var lbl = null;
      //if (existingField.type !== newField.type) {
      //  switch (newField.type) {
      //    case "esriFieldTypeString":
      //      if (newField.type === "esriFieldTypeString") {
      //      }
      //      else if (newField.type === "esriFieldTypeString") {
      //      }
      //      else if (newField.type === "esriFieldTypeSmallInteger") {
      //      }
      //      else if (newField.type === "esriFieldTypeInteger") {
      //      }
      //      else if (newField.type === "esriFieldTypeSingle") {
      //      }
      //      else if (newField.type === "esriFieldTypeDouble") {
      //      }
      //      else if (newField.type === "esriFieldTypeGUID") {
      //      }
      //      else if (newField.type === "esriFieldTypeDate") {
      //      }
      //    case "esriFieldTypeSmallInteger":
      //      break;
      //    case "esriFieldTypeInteger":
      //      break;
      //    case "esriFieldTypeSingle":
      //      break;
      //    case "esriFieldTypeDouble":
      //      if (newField.type === "esriFieldTypeString") {
      //      }
      //      else if (newField.type === "esriFieldTypeString") {
      //      }
      //      else if (newField.type === "esriFieldTypeSmallInteger") {
      //        lbl = existingField.label;
      //        existingField = lang.clone(newField);
      //        existingField.label = lbl;
      //      }
      //      else if (newField.type === "esriFieldTypeInteger") {
      //        lbl = existingField.label;
      //        existingField = lang.clone(newField);
      //        existingField.label = lbl;
      //      }
      //      else if (newField.type === "esriFieldTypeSingle") {
      //        lbl = existingField.label;
      //        existingField = lang.clone(newField);
      //        existingField.label = lbl;
      //      }
      //      else if (newField.type === "esriFieldTypeDouble") {
      //      }
      //      else if (newField.type === "esriFieldTypeGUID") {
      //      }
      //      else if (newField.type === "esriFieldTypeDate") {
      //      }
      //      break;
      //    case "esriFieldTypeGUID":
      //      break;
      //    case "esriFieldTypeDate":
      //      break;
      //  }
      //}
      return existingField;
    },
    _fillPresetValueTable: function _fillPresetValueTable(editLayerInfos) {
      this._presetFieldInfos = [];

      array.forEach(editLayerInfos, function (layerInfo) {
        // ignore preset values for layer with update features only
        if (!layerInfo.allowUpdateOnly) {
          array.forEach(layerInfo.fieldInfos, function (fieldInfo) {
            if (fieldInfo.canPresetValue) {
              var fieldExists = false;
              // concat aliases if needed
              var idx = fieldInfo.label.indexOf("<a ");
              var fieldLabel = idx < 0 ? fieldInfo.label : fieldInfo.label.substring(0, idx);
              if (fieldLabel === "") {
                fieldLabel = fieldInfo.fieldName;
              }
              for (var i = 0; i < this._presetFieldInfos.length; i++) {
                if (this._presetFieldInfos[i].fieldName === fieldInfo.fieldName) {
                  // found the same field name
                  fieldExists = true;
                  // concat fieldAlias if needed
                  if (!editUtils.checkIfFieldAliasAlreadyExists(this._presetFieldInfos[i].label, fieldLabel)) {
                    this._presetFieldInfos[i].label = lang.replace("{alias},{anotherAlias}", {
                      alias: this._presetFieldInfos[i].label,
                      anotherAlias: fieldLabel
                    });
                    break;
                  }
                  this._presetFieldInfos[i] = this._changeFieldToMostRestrictive(this._presetFieldInfos[i], fieldInfo);
                } //
              }

              // or add to the collection if new
              if (!fieldExists) {
                var newField = lang.clone(fieldInfo);
                newField.label = fieldLabel;
                this._presetFieldInfos.push(newField);
              }
            }
          }, this);
        }
      }, this);
      var presetValueTable = query("#eePresetValueBody")[0];
      // fill the table
      array.forEach(this._presetFieldInfos, lang.hitch(this, function (presetFieldInfo) {
        if (presetFieldInfo.type !== "esriFieldTypeGeometry" && presetFieldInfo.type !== "esriFieldTypeOID" && presetFieldInfo.type !== "esriFieldTypeBlob" && presetFieldInfo.type !== "esriFieldTypeGlobalID" && presetFieldInfo.type !== "esriFieldTypeRaster" && presetFieldInfo.type !== "esriFieldTypeXML") {

          var row = domConstruct.create("tr");
          var label = domConstruct.create("td", { "class": "ee-atiLabel" });
          label.innerHTML = lang.replace('{fieldAlias}', {
            fieldAlias: presetFieldInfo.label
          });

          domConstruct.place(label, row);

          var valueColumnNode = domConstruct.create("td", { "class": "preset-value-editable" }, row);

          var presetValueNodes = this._createPresetFieldContentNode(presetFieldInfo);
          var dateWidget = null;
          var timeWidget = null;
          array.forEach(presetValueNodes, function (presetValueNode) {
            if (presetValueNode.declaredClass === "dijit.form.DateTextBox") {
              dateWidget = presetValueNode;
            }
            if (presetValueNode.declaredClass === "dijit.form.TimeTextBox") {
              timeWidget = presetValueNode;
            }
            domConstruct.place(presetValueNode.domNode, valueColumnNode, "last");
          }, this);
          if (dateWidget !== null) {
            this.own(on(label, 'click', lang.hitch(this, this._dateClick(dateWidget, timeWidget))));
          }
          presetValueTable.appendChild(row);
        }
      }));

      // BEGIN: ECAN CHANGE - Refresh UI Links to account for preset value parameters
      this._updateLinksUI();
      // END: ECAN CHANGE
    },

    _dateClick: function _dateClick(dateWidget, timeWidget) {
      return function () {
        if (dateWidget !== undefined && dateWidget !== null) {
          dateWidget.set('value', new Date());
        }
        if (timeWidget !== undefined && timeWidget !== null) {
          timeWidget.set('value', new Date());
        }
      };
    },
    _getEditableLayers: function _getEditableLayers(layerInfos, allLayers) {
      var layers = [];
      array.forEach(layerInfos, function (layerInfo) {
        if (!layerInfo.allowUpdateOnly || allLayers) {
          //
          var layerObject = this.map.getLayer(layerInfo.featureLayer.id);
          if (layerObject && layerObject.visible && layerObject.isVisibleAtScale(this.map.getScale()) && layerObject.isEditable && layerObject.isEditable()) {
            layers.push(layerObject);
          }
        }
      }, this);

      return layers;
    },
    _getEditableLayersInfos: function _getEditableLayersInfos(layerInfos, allLayers) {
      var layers = [];
      array.forEach(layerInfos, function (layerInfo) {
        if (!layerInfo.allowUpdateOnly || allLayers) {
          //
          var layerObject = this.map.getLayer(layerInfo.featureLayer.id);
          if (layerObject && layerObject.visible && layerObject.isVisibleAtScale(this.map.getScale()) && layerObject.isEditable && layerObject.isEditable()) {
            layers.push(layerInfo);
          }
        }
      }, this);

      return layers;
    },
    _getLayerInfoForLocalLayer: function _getLayerInfoForLocalLayer(localLayer) {

      var result = this._getLayerInfoByID(localLayer.originalLayerId);
      var layerInfo;

      if (result !== null) {
        //(layerObject.type === "Feature Layer" && layerObject.url) {
        // get the fieldInfos
        layerInfo = {};
        for (var k in result) {
          if (result.hasOwnProperty(k) && k !== 'featureLayer' && k !== 'layerInfo') {
            layerInfo[k] = lang.clone(result[k]);
          }
        }

        layerInfo.featureLayer = localLayer;
      }
      return layerInfo;
    },
    _getSelectionSymbol: function _getSelectionSymbol(geometryType, highlight) {
      if (!geometryType || geometryType === "") {
        return null;
      }

      var selectionSymbol;
      switch (geometryType) {
        case "esriGeometryPoint":
          if (highlight === true) {
            selectionSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 20, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 230, 169, 1]), 2), new Color([0, 230, 169, 0.65]));
          } else {
            selectionSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 20, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([92, 92, 92, 1]), 2), new Color([255, 255, 0, 0.65]));
          }
          break;
        case "esriGeometryPolyline":
          if (highlight === true) {
            selectionSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0, 255, 255, 0.65]), 2);
          } else {
            selectionSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255, 255, 0, 0.65]), 2);
          }
          break;
        case "esriGeometryPolygon":
          var line;
          if (highlight === true) {
            selectionSymbol = new SimpleFillSymbol().setColor(new Color([0, 230, 169, 0.65]));
            line = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([192, 192, 192, 1]), 2);
          } else {
            // yellow with black outline
            selectionSymbol = new SimpleFillSymbol().setColor(new Color([255, 255, 0, 0.65]));
            line = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([192, 192, 192, 1]), 2);
          }
          selectionSymbol.setOutline(line);
          break;
      }
      return selectionSymbol;
    },
    _hasPresetValueFields: function _hasPresetValueFields(layerInfos) {
      return layerInfos.some(function (layerInfo) {
        if (layerInfo.allowUpdateOnly === false) {
          if (layerInfo.fieldInfos) {
            return layerInfo.fieldInfos.some(function (fi) {
              return fi.canPresetValue === true;
            });
          } else {
            return false;
          }
        } else {
          return false;
        }
      }, this);
    },

    _initPresetFieldsTable: function _initPresetFieldsTable() {
      var presetValueTableNode = domConstruct.create("div", { "class": "ee-presetValueTableDiv templatePicker" }, this.presetFieldsTableNode);

      var bodyDiv = domConstruct.create("div", { "class": "bodyDiv" }, presetValueTableNode);
      var bodyTable = domConstruct.create("table", { "class": "ee-presetValueBodyTable" }, bodyDiv);

      domConstruct.create("tbody", { "class": "ee-presetValueBody", "id": "eePresetValueBody" }, bodyTable, "first");
    },

    _setPresetValueValue: function _setPresetValueValue(fieldName, value) {
      var presetValueTable = query("#eePresetValueBody")[0];
      if (presetValueTable) {
        var inputElements = query(".preset-value-editable .ee-inputField");
        array.forEach(inputElements, lang.hitch(this, function (ele) {

          if (!domClass.contains(ele, "dijitTimeTextBox")) {
            var elem = dijit.byNode(ele);
            if (elem !== undefined && elem !== null) {
              if (elem.get("name") === fieldName) {
                elem.set("value", value);
              }
            }
            //else {
            //  var element = query("input[type='hidden']", ele);
            //  if (!element || element.length === 0) {
            //    element = query("input", ele);
            //  }
            //  if (element[0].name === fieldName) {
            //    element[0].value = value;
            //  }
            //}
          }
        }));

        /* BEGIN: ECAN CHANGES - Call to update the link button urls if preset values change */
        this._updateLinksUI();
        /* END: ECAN CHANGES */
      }
    },

    /* BEGIN: Ecan Changes */

    _getPresetValues: function _getPresetValues() {
      var values = [];
      var presetValueTable = query("#eePresetValueBody")[0];
      if (presetValueTable) {
        var inputElements = query(".preset-value-editable .ee-inputField");
        array.forEach(inputElements, lang.hitch(this, function (ele) {

          if (!domClass.contains(ele, "dijitTimeTextBox")) {
            var elem = dijit.byNode(ele);
            if (elem !== undefined && elem !== null) {
              values.push({
                "fieldName": elem.get("name"),
                "value": elem.get("value")
              });
            }
            //else {
            //  var element = query("input[type='hidden']", ele);
            //  if (!element || element.length === 0) {
            //    element = query("input", ele);
            //  }
            //  if (element[0].name === fieldName) {
            //    element[0].value = value;
            //  }
            //}
          }
        }));
      }

      return values;
    },

    /* END: Ecan Changes */

    _modifyAttributesWithPresetValues: function _modifyAttributesWithPresetValues(attributes, newTempLayerInfos) {
      var presetValueTable = query("#eePresetValueBody")[0];
      var presetFieldInfos = array.filter(newTempLayerInfos.fieldInfos, function (fieldInfo) {
        return fieldInfo.canPresetValue === true;
      });
      var presetFields = array.map(presetFieldInfos, function (presetFieldInfo) {
        return presetFieldInfo.fieldName;
      });
      if (presetValueTable) {
        var inputElements = query(".preset-value-editable .ee-inputField");
        array.forEach(inputElements, lang.hitch(this, function (ele) {

          var elem = dijit.byNode(ele);
          var dateVal = null;
          if (elem.declaredClass !== "dijit.form.TimeTextBox") {
            var valToSet = elem.get("value");
            if (valToSet !== undefined && valToSet !== null && valToSet !== "") {
              if (elem.declaredClass === "dijit.form.DateTextBox") {
                var timeElement = query(".dijitTimeTextBox", ele.parentNode)[0];
                // retrieve the value
                dateVal = new Date(valToSet);
                if (dateVal.toString() !== "Invalid Date") {
                  if (timeElement !== undefined && timeElement !== null) {
                    var timVal = new Date(dijit.byNode(timeElement).get("value"));
                    if (timVal.toString() !== "Invalid Date") {
                      dateVal.setHours(timVal.getHours());
                      dateVal.setMinutes(timVal.getMinutes());
                      dateVal.setSeconds(timVal.getSeconds());
                      valToSet = dateVal.getTime();
                    }
                  } else {
                    valToSet = dateVal.getTime();
                  }
                }
              }
              // set the attribute value
              if (valToSet !== undefined && valToSet !== null && valToSet !== "") {
                for (var attribute in attributes) {
                  if (attributes.hasOwnProperty(attribute) && attribute === elem.get("name") && presetFields.indexOf(elem.get("name")) >= 0) {

                    var editfieldInfo = array.filter(newTempLayerInfos.fieldInfos, function (fieldInfo) {
                      return fieldInfo.fieldName === elem.get("name");
                    })[0];

                    if (editfieldInfo && editFieldInfo.type === "esriFieldTypeGUID" && valToSet.indexOf("{") === -1) {
                      attributes[attribute] = "{" + valToSet + "}";
                    } else {
                      attributes[attribute] = valToSet;
                    }

                    break;
                  }
                }
              }
            }
          }
        }));
      }
    },

    // to add (*) to the label of required fields
    // also add field type and domain to use in the preset values
    processConfigForRuntime: function processConfigForRuntime(configInfo) {

      if (!configInfo) {
        return;
      }
      configInfo.fieldInfos = array.filter(configInfo.fieldInfos, function (fieldInfo) {
        if (fieldInfo.type === "esriFieldTypeBlob" || fieldInfo.type === "esriFieldTypeGlobalID" || fieldInfo.type === "esriFieldTypeRaster" || fieldInfo.type === "esriFieldTypeXML") {
          //fieldInfo.type === "esriFieldTypeGeometry" || fieldInfo.type === "esriFieldTypeOID" ||
          return false;
        }
        if (fieldInfo.nullable === false && fieldInfo.editable === true) {
          //Removed for JS api 3.20 as this is part of the Attribute Inspector
          //if (fieldInfo.label.indexOf('<a class="asteriskIndicator">') < 0) {
          //  fieldInfo.label = fieldInfo.label +
          //    '<a class="asteriskIndicator"> *</a>';
          //}
        }
        if (fieldInfo.isEditable === true) {
          return true;
        } else {
          return fieldInfo.visible;
        }
      });
    },

    _newAttrInspectorNeeded: function _newAttrInspectorNeeded() {
      var yes = false;

      if (!this.attrInspector || this.attrInspector.layerInfos.length > 1) {
        yes = true;
      } else {
        //this.attrInspector.layerInfos.length == 1

        var lflId = this.attrInspector.layerInfos[0].featureLayer.id;
        if (lflId.indexOf("_lfl") > 0) {
          // attrInspector associated with a local feature
          yes = lflId.indexOf(this.templatePicker.getSelected().featureLayer.id) < 0;
        } else {

          yes = true;
        }
      }

      if (yes && this.attrInspector) {
        this.attrInspector.destroy();
        this.attrInspector = null;
      } else {
        if (this._attachmentUploader && this._attachmentUploader !== null) {
          this._attachmentUploader.clear();
        }
      }
      return yes;
    },

    _onMapClick: function _onMapClick(evt) {
      if (this._byPass && this._byPass === true) {
        this._byPass = false;
        return;
      }
      var hasTemplate = false;
      if (this.templatePicker) {
        hasTemplate = this.templatePicker.getSelected() ? true : false;
      }
      if (!this._attrInspIsCurrentlyDisplayed && evt.mapPoint && hasTemplate === false) {
        this._processOnMapClick(evt);
      }
    },
    _attachmentsComplete: function _attachmentsComplete(featureLayer, oid, deferred) {
      return function (results) {
        var errorMsg = "";
        array.forEach(results, function (result) {
          if (result) {
            if (result.state === "rejected") {
              if (result.error && esriLang.isDefined(result.error.code)) {
                if (result.error.code === 400) {
                  // 400 is returned for unsupported attachment file types
                  errorMsg = errorMsg + esriBundle.widgets.attachmentEditor.NLS_fileNotSupported + "<br/>";
                } else {
                  errorMsg = errorMsg + result.error.message || (result.error.details && result.error.details.length && result.error.details[0]) + "<br/>";
                }
              }
            }
          }
        }, this);
        if (errorMsg !== "") {
          var dialog = new Popup({
            titleLabel: this.nls.attachmentLoadingError,
            width: 400,
            maxHeight: 200,
            autoHeight: true,
            content: errorMsg,
            buttons: [{
              label: this.nls.back,
              classNames: ['jimu-btn'],
              onClick: lang.hitch(this, function () {
                dialog.close();
              })
            }],
            onClose: lang.hitch(this, function () {})
          });
        }
        return this._completePost(featureLayer, oid, deferred);
      };
    },
    _selectComplete: function _selectComplete(featureLayer, deferred) {
      return function () {
        this._removeLocalLayers();
        this.currentFeature = null;
        this._showTemplate(false);
        deferred.resolve("success");
      };
    },
    _completePost: function _completePost(featureLayer, oid, deferred) {
      this._createAttributeInspector([this.currentLayerInfo]);
      var query = new Query();
      query.objectIds = [oid];
      featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, lang.hitch(this, this._selectComplete(featureLayer, deferred)), lang.hitch(this, function () {
        deferred.resolve("failed");
      }));
    },
    // posts the currentFeature's changes
    _postChanges: function _postChanges(feature) {

      var deferred = new Deferred();

      var result = this._changed_feature(feature, false);
      var returnFeature = result[0];
      var layerId = result[1];
      var type = result[2];
      var layer = null;
      var postDef = null;
      if (returnFeature === null) {
        deferred.resolve("success");
      } else if (type === "Add") {
        layer = this.map.getLayer(layerId);
        postDef = layer.applyEdits([returnFeature], null, null);
        this.addDeferred(postDef, returnFeature, layer, deferred);
      } else {
        layer = this.map.getLayer(layerId);
        if (Object.keys(returnFeature.attributes).length === 0 && returnFeature.geometry === null) {
          deferred.resolve("success");
        } else if (Object.keys(returnFeature.attributes).length === 1 && returnFeature.attributes.hasOwnProperty(layer.objectIdField) && returnFeature.geometry === null) {
          //check to see if the only field is the OID, if so, skip saving
          deferred.resolve("success");
        } else {
          postDef = layer.applyEdits(null, [returnFeature], null);
          this.addDeferred(postDef, returnFeature, layer, deferred);
        }
      }
      return deferred.promise;
    },
    _changed_feature: function _changed_feature(feature, removeOIDField) {
      var returnFeature = null;
      var type = null;
      var featureLayer = null;
      var featureLayerId = null;
      removeOIDField = removeOIDField || false;
      var ruleInfo;
      var k = null;
      if (feature) {
        returnFeature = new Graphic(null, null, JSON.parse(JSON.stringify(feature.attributes)));

        if (this._smartAttributes !== undefined && this._smartAttributes !== null) {
          for (k in returnFeature.attributes) {
            if (returnFeature.attributes.hasOwnProperty(k) === true) {
              ruleInfo = this._smartAttributes.validateField(k);
              if (ruleInfo[1] === 'Hide' && ruleInfo[3] !== true) {
                delete returnFeature.attributes[k];
              }
            }
          }
        }
        for (k in returnFeature.attributes) {
          if (returnFeature.attributes.hasOwnProperty(k) === true) {
            if (returnFeature.attributes[k] === "") {
              returnFeature.attributes[k] = null;
            }
          }
        }
        if (this._attributeInspectorTools) {
          returnFeature.attributes = this._attributeInspectorTools._checkFeatureData(returnFeature.attributes);
          if (feature.preEditAttrs) {
            returnFeature.preEditAttrs = this._attributeInspectorTools._checkFeatureData(JSON.parse(JSON.stringify(feature.preEditAttrs)));
          }
        } else {
          if (feature.preEditAttrs) {
            returnFeature.preEditAttrs = JSON.parse(JSON.stringify(feature.preEditAttrs)); //lang.clone(feature.preEditAttrs);
          }
        }
        if (feature.getLayer().originalLayerId) {
          // added feature
          featureLayer = this.map.getLayer(feature.getLayer().originalLayerId);
          if (featureLayer) {
            returnFeature.geometry = feature.geometry;
            returnFeature.symbol = null;
            type = "Add";
            removeOIDField = true;
          } // if featureLayer not null
        } else {
          // update existing feature
          // only get the updated attributes

          if (this.geometryChanged !== undefined && this.geometryChanged !== null && this.geometryChanged === true) {
            returnFeature.geometry = feature.geometry;
          }

          featureLayer = feature.getLayer();

          var newAttrs = editUtils.filterOnlyUpdatedAttributes(returnFeature.attributes, returnFeature.preEditAttrs, featureLayer);

          if (newAttrs && !editUtils.isObjectEmpty(newAttrs)) {
            // there are changes in attributes
            returnFeature.attributes = newAttrs;
          } else {
            returnFeature.attributes = [];
          }
          returnFeature.symbol = null;
          type = "Update";
        }
        featureLayerId = featureLayer.id;
        if (returnFeature && removeOIDField) {
          if (returnFeature.attributes.hasOwnProperty(featureLayer.objectIdField)) {
            delete returnFeature.attributes[featureLayer.objectIdField];
          }
        }

        if (featureLayer.globalIdField && returnFeature.attributes.hasOwnProperty(featureLayer.globalIdField)) {
          delete returnFeature.attributes[featureLayer.globalIdField];
        }
        if (featureLayer.editFieldsInfo) {
          for (k in featureLayer.editFieldsInfo) {
            if (featureLayer.editFieldsInfo.hasOwnProperty(k)) {
              if (returnFeature.attributes.hasOwnProperty(featureLayer.editFieldsInfo[k])) {
                delete returnFeature.attributes[featureLayer.editFieldsInfo[k]];
              }
            }
          }
        }
      }

      return [returnFeature, featureLayerId, type];
    },

    addDeferred: function addDeferred(postDef, feature, featureLayer, deferred) {
      postDef.then(lang.hitch(this, function (added, updated) {
        // sometimes a successfully update returns an empty array
        if (updated && updated.length > 0 && updated[0].hasOwnProperty("error")) {
          Message({
            message: updated[0].error.toString()
          });
          deferred.resolve("failed");
        } else if (updated && updated.length > 0) {
          feature.preEditAttrs = JSON.parse(JSON.stringify(feature.attributes));
          featureLayer.refresh();
          this.geometryChanged = false;
          deferred.resolve("success");
        } else if (added && added.length > 0 && added[0].hasOwnProperty("error")) {

          Message({
            message: added[0].error.toString()
          });
          deferred.resolve("failed");
        } else if (added && added.length > 0) {
          feature.preEditAttrs = JSON.parse(JSON.stringify(feature.attributes));
          var defs = null;
          if (this._attachmentUploader) {
            defs = this._attachmentUploader.postAttachments(featureLayer, added[0].objectId);
          }
          if (defs === undefined || defs === null || defs.length === 0) {
            this._completePost(featureLayer, added[0].objectId, deferred);
          } else {
            all(defs).then(lang.hitch(this, this._attachmentsComplete(featureLayer, added[0].objectId, deferred)));
          }
        }
      }), lang.hitch(this, function (err) {
        Message({
          message: err.message.toString() + "\n" + err.details
        });
        deferred.resolve("failed");
      }));
    },

    _processOnMapClick: function _processOnMapClick(evt) {
      // viewing/editing existing features
      // The logic of adding new feature to local layer is handled
      // in the draw end event of the draw tool

      this.map.infoWindow.hide();
      // recreate the attr inspector if needed
      this._createAttributeInspector(this.config.editor.configInfos);

      var layers = this.map.getLayersVisibleAtScale().filter(lang.hitch(this, function (lyr) {
        if (lyr.type && lyr.type === "Feature Layer" && lyr.url) {
          return array.some(this.config.editor.configInfos, function (configInfo) {
            if (configInfo.layerId === lyr.id && configInfo.configFeatureLayer.layerAllowsUpdate === true) {
              return true;
            } else {
              return false;
            }
          });
        } else {
          return false;
        }
      }));
      //remove no visible layers, for some reason the function above returns true
      layers = layers.filter(lang.hitch(this, function (lyr) {
        try {
          return this.map.getLayer(lyr.id).visible;
        } catch (ex) {
          console.log(ex + " Check for visible failed");
          return true;
        }
      }));
      var updateFeatures = [];
      var deferreds = [];
      this.currentFeature = null;
      this.geometryChanged = false;
      this.currentLayerInfo = null;
      array.forEach(layers, lang.hitch(this, function (layer) {
        // set selection symbol
        layer.setSelectionSymbol(this._getSelectionSymbol(layer.geometryType, false));
        var selectQuery = new Query();

        /* BEGIN: Ecan Change - Altered to support polyline and polygon inputs rather than assuming just the map point */

        if (evt.mapPoint) {
          selectQuery.geometry = editUtils.pointToExtent(this.map, evt.mapPoint, 20);
        } else {
          selectQuery.geometry = evt.geometry;
        }

        /* END: Ecan Change */

        var deferred = layer.selectFeatures(selectQuery, FeatureLayer.SELECTION_NEW, lang.hitch(this, function (features) {
          var OIDsToRemove = [];
          var validFeatures = [];
          array.forEach(features, function (feature) {
            var featureValid = true;
            feature.allowDelete = true;
            //if (layer.hasOwnProperty("ownershipBasedAccessControlForFeatures") &&
            //  layer.ownershipBasedAccessControlForFeatures) {
            //  if (layer.ownershipBasedAccessControlForFeatures.hasOwnProperty("allowOthersToUpdate")) {
            //    if (layer.ownershipBasedAccessControlForFeatures.allowOthersToUpdate === false && this._user) {
            //      if (feature.attributes[layer.editFieldsInfo.creatorField] !== this._user) {
            //        OIDsToRemove.push(feature.attributes[layer.objectIdField]);
            //        featureValid = false;
            //      }
            //    }
            //  }
            //  if (layer.ownershipBasedAccessControlForFeatures.hasOwnProperty("allowOthersToUpdate") &&
            //    layer.ownershipBasedAccessControlForFeatures.hasOwnProperty("allowAnonymousToUpdate")) {
            //    if (layer.ownershipBasedAccessControlForFeatures.allowOthersToUpdate === false &&
            //      layer.ownershipBasedAccessControlForFeatures.allowAnonymousToUpdate === true &&
            //      this._user === null) {
            //      if (feature.attributes[layer.editFieldsInfo.creatorField] !== null &&
            //         feature.attributes[layer.editFieldsInfo.creatorField] !== "") {
            //        OIDsToRemove.push(feature.attributes[layer.objectIdField]);
            //        featureValid = false;
            //      }
            //    }
            //  }
            //  else if (layer.ownershipBasedAccessControlForFeatures.hasOwnProperty("allowAnonymousToUpdate")) {
            //    if (layer.ownershipBasedAccessControlForFeatures.allowAnonymousToUpdate === false &&
            //      this._user === null) {
            //      OIDsToRemove.push(feature.attributes[layer.objectIdField]);
            //      featureValid = false;
            //    }
            //  }
            //  if (layer.ownershipBasedAccessControlForFeatures.hasOwnProperty("allowOthersToDelete")) {
            //    if (layer.ownershipBasedAccessControlForFeatures.allowOthersToDelete === false &&
            //      this._user) {
            //      if (feature.attributes[layer.editFieldsInfo.creatorField] !== this._user) {
            //        feature.allowDelete = false;
            //      }
            //    }
            //  }
            //  if (layer.ownershipBasedAccessControlForFeatures.hasOwnProperty("allowOthersToDelete") &&
            //  layer.ownershipBasedAccessControlForFeatures.hasOwnProperty("allowAnonymousToDelete")) {
            //    if (layer.ownershipBasedAccessControlForFeatures.allowOthersToDelete === false &&
            //      layer.ownershipBasedAccessControlForFeatures.allowAnonymousToDelete === true &&
            //      this._user === null) {
            //      if (feature.attributes[layer.editFieldsInfo.creatorField] !== null &&
            //          feature.attributes[layer.editFieldsInfo.creatorField] !== "") {
            //        OIDsToRemove.push(feature.attributes[layer.objectIdField]);
            //        featureValid = false;
            //      }
            //    }
            //  }
            //  else if (layer.ownershipBasedAccessControlForFeatures.hasOwnProperty("allowAnonymousToDelete")) {
            //    if (layer.ownershipBasedAccessControlForFeatures.allowAnonymousToDelete === false &&
            //      this._user === null) {
            //      feature.allowDelete = false;
            //    }
            //  }
            //}

            //The below is the preferred way, but this fails on public services and the user is logged in

            if (!layer.getEditCapabilities({ feature: feature }).canUpdate) {
              //feature.allowDelete = false;
              OIDsToRemove.push(feature.attributes[layer.objectIdField]);
              featureValid = false;
            } else if (!layer.getEditCapabilities({ feature: feature }).canDelete) {
              feature.allowDelete = false;
            }
            if (featureValid === true) {
              feature.preEditAttrs = JSON.parse(JSON.stringify(feature.attributes));
              validFeatures.push(feature);
            }
          }, this);
          if (OIDsToRemove.length > 0) {
            var subQuery = new Query();
            subQuery.objectIds = OIDsToRemove;
            var subDef = layer.selectFeatures(subQuery, FeatureLayer.SELECTION_SUBTRACT, lang.hitch(this, function (features) {
              console.log(features.length);
            }));
            deferreds.push(subDef);
          }
          updateFeatures = updateFeatures.concat(validFeatures);
        }));
        deferreds.push(deferred);
      }));
      if (deferreds.length === 0) {
        this._byPass = true;
        this.map.popupManager._showPopup(evt);
        this._byPass = false;
      } else {
        all(deferreds).then(lang.hitch(this, function () {
          this.updateFeatures = updateFeatures;
          if (this.updateFeatures.length > 0) {
            this._showTemplate(false);
          } else {
            this._byPass = true;
            this.map.popupManager._showPopup(evt);
            this._byPass = false;
          }
        }));
      }
    },
    _attachLayerHandler: function _attachLayerHandler() {

      if (this.layerHandle) {
        this.layerHandle.remove();
      }
      this.layerHandle = on(this.currentFeature._layer, 'selection-clear', lang.hitch(this, this._layerChangeOutside));
      this.own(this.layerHandle);

      this._eventHandler = this.own(on(this.currentFeature._layer, "visibility-change", lang.hitch(this, function () {
        setTimeout(lang.hitch(this, function () {
          var cancelBtn = query(".cancelButton")[0];
          if (!cancelBtn) {
            //do nothing
          } else {
            on.emit(cancelBtn, 'click', { cancelable: true, bubbles: true });
          }
        }), 100);
      })));
    },

    _removeLayerVisibleHandler: function _removeLayerVisibleHandler() {
      if (this._eventHandler !== null) {
        array.forEach(this._eventHandler, lang.hitch(this, function (evt) {
          if (typeof evt.remove === "function") {
            evt.remove();
          }
        }));
        this._eventHandler = null;
      }
    },

    _postFeatureSave: function _postFeatureSave(evt) {
      if (this.updateFeatures && this.updateFeatures.length > 1) {
        array.forEach(this.updateFeatures, lang.hitch(this, function (feature) {
          feature.setSymbol(this._getSelectionSymbol(feature.getLayer().geometryType, false));
        }));
      }
      if (evt && evt.feature) {
        this.geometryChanged = false;
        this.currentFeature = evt.feature;
        this.currentFeature.preEditAttrs = JSON.parse(JSON.stringify(this.currentFeature.attributes));
        this._attachLayerHandler();
        this.currentLayerInfo = this._getLayerInfoByID(this.currentFeature._layer.id);
        this.currentLayerInfo.isCache = false;
        this._createSmartAttributes();
        this._createAttributeInspectorTools();
        this._attributeInspectorTools.triggerFormValidation();
        this._validateAttributes();
        this._enableAttrInspectorSaveButton(false);
        if (this.currentFeature.hasOwnProperty("allowDelete")) {
          this._toggleDeleteButton(this.currentFeature.allowDelete && this.currentLayerInfo.allowDelete);
        } else {
          this._toggleDeleteButton(this.currentLayerInfo.allowDelete);
        }
        this._toggleEditGeoSwitch(this.currentLayerInfo.disableGeometryUpdate || !this.currentLayerInfo.configFeatureLayer.layerAllowsUpdate);
        //|| this.currentLayerInfo.featureLayer.hasZ || this.currentLayerInfo.featureLayer.hasM
        this.currentFeature.setSymbol(this._getSelectionSymbol(evt.feature.getLayer().geometryType, true));
        if (this.currentLayerInfo.editDescription && this.currentLayerInfo.editDescription !== null) {
          this.editDescription.innerHTML = this.currentLayerInfo.editDescription;
          this.editDescription.style.display = "block";
        } else {
          this.editDescription.style.display = "none";
        }
        //this.getConfigDefaults();
      }
    },

    _promptToDelete: function _promptToDelete() {

      var dialog = new Popup({
        titleLabel: this.nls.deletePromptTitle,
        width: 400,
        maxHeight: 200,
        autoHeight: true,
        content: this.nls.deletePrompt,
        buttons: [{
          label: this.nls.yes,
          classNames: ['jimu-btn'],
          onClick: lang.hitch(this, function () {
            this._deleteFeature();
            dialog.close();
          })
        }, {
          label: this.nls.no,
          classNames: ['jimu-btn'],

          onClick: lang.hitch(this, function () {

            dialog.close();
          })
        }],
        onClose: lang.hitch(this, function () {})
      });
    },
    _promptToResolvePendingEdit: function _promptToResolvePendingEdit(switchToTemplate, evt, showClose, skipPostEvent) {
      skipPostEvent = skipPostEvent || false;
      var disable = !this._validateAttributes();
      var buttons = [{
        label: this.nls.yes,
        classNames: ['jimu-btn'],
        disable: disable,
        onClick: lang.hitch(this, function () {
          this._saveEdit(this.currentFeature, switchToTemplate, true).then(lang.hitch(this, function () {
            if (evt !== null && evt !== undefined) {
              if (evt.hasOwnProperty('featureLayer') && evt.hasOwnProperty('feature')) {
                this.load_from_featureaction(evt.featureLayer, evt.feature);
              } else {
                this._postFeatureSave(evt);
              }
            }
          }));
          dialog.close();
        })
      }, {
        label: this.nls.no,
        classNames: ['jimu-btn'],

        onClick: lang.hitch(this, function () {
          this._cancelEditingFeature(switchToTemplate);
          if (evt !== null && evt !== undefined) {
            if (evt.hasOwnProperty('featureLayer') && evt.hasOwnProperty('feature')) {
              this.load_from_featureaction(evt.featureLayer, evt.feature);
            } else {
              this._postFeatureSave(evt);
            }
          }
          dialog.close();
        })
      }];
      if (showClose && showClose === true) {
        buttons.push({
          label: this.nls.back,
          classNames: ['jimu-btn'],
          onClick: lang.hitch(this, function () {
            dialog.close();
          })
        });
      }

      var dialog = new Popup({
        titleLabel: this.nls.savePromptTitle,
        width: 400,
        maxHeight: 200,
        autoHeight: true,
        content: this.nls.savePrompt,
        buttons: buttons,
        onClose: lang.hitch(this, function () {})
      });
    },

    _removeLocalLayers: function _removeLocalLayers() {
      if (this.cacheLayer && this.cacheLayer !== null) {
        this.cacheLayer.clearSelection();
        this.cacheLayer.clear();
        this.map.removeLayer(this.cacheLayer);
        this.cacheLayer = null;
      }
      this.updateFeatures = [];
      //var mymap = this.map;
      //if (mymap) {
      //  var filteredID = mymap.graphicsLayerIds.filter(function (e) {
      //    return e.lastIndexOf("_lfl") > 0;
      //  });
      //  var mappedArr = array.map(filteredID, function (e) {
      //    return mymap.getLayer(e);
      //  });
      //  array.forEach(mappedArr, function (e) {
      //    mymap.removeLayer(e);
      //  });

      //  this.updateFeatures = [];
      //}
    },

    _removeSpacesInLayerTemplates: function _removeSpacesInLayerTemplates(layer) {
      if (!layer) {
        return;
      }

      var filteredFields = array.filter(layer.fields, lang.hitch(this, function (field) {
        return field.nullable === false && field.editable === true;
      }));
      array.forEach(filteredFields, lang.hitch(this, function (f) {
        // trim of space in the field value
        array.forEach(layer.templates, function (t) {
          if (t.prototype.attributes[f.name] === " ") {
            t.prototype.attributes[f.name] = t.prototype.attributes[f.name].trim();
          }
        });
      }));
    },

    _resetEditingVariables: function _resetEditingVariables() {
      this._editingEnabled = false;
      if (this.editToolbar) {
        if (this.editToolbar.getCurrentState().tool !== 0) {
          this.editToolbar.deactivate();
        }
      }
      //this._turnEditGeometryToggleOff();
    },
    _feature_removed: function _feature_removed(feature, curidx) {
      return function () {
        if (this.attrInspector._featureIdx >= curidx && curidx !== 0) {
          //Clear the current feature as it is saved and has been removed.  This prevents the double save dialog.
          this.currentFeature = null;
          this.attrInspector.previous();
        }
        this.updateFeatures.splice(this.updateFeatures.indexOf(feature), 1);
        //bypass moving to the next record if the user click next and was prompted to save
      };
    },
    // perform validation then post the changes or formatting the UI if errors
    // no confirm dialog involved
    _saveEdit: function _saveEdit(feature, switchToTemplate, attInspectRecordOptions) {
      attInspectRecordOptions = attInspectRecordOptions || 'next';
      var deferred = new Deferred();
      // disable the save button even if the saving is done
      this._enableAttrInspectorSaveButton(false);
      this._turnEditGeometryToggleOff();
      if (this._validateAttributes()) {
        var processIndicators = query(".processing-indicator");
        var processIndicatorsPanel = query(".processing-indicator-panel");
        var saveBtn = query(".saveButton")[0];
        array.forEach(processIndicators, function (processIndicator) {
          if (!domClass.contains(processIndicator, "busy")) {
            domClass.add(processIndicator, "busy");
          }
        });
        array.forEach(processIndicatorsPanel, function (processIndicator) {
          if (!domClass.contains(processIndicator, "busy")) {
            domClass.add(processIndicator, "busy");
          }
        });
        if (!domClass.contains(saveBtn, "hide")) {
          domClass.add(saveBtn, "hide");
        }
        // call applyEdit
        this._postChanges(feature).then(lang.hitch(this, function (e) {
          if (e === "failed") {
            deferred.resolve("failed");
          } else {
            // if currently only one selected feature
            if (this.config.editor.removeOnSave && this.updateFeatures.length <= 1) {
              switchToTemplate = true;
            }
            if (switchToTemplate && switchToTemplate === true) {
              this._showTemplate(true);
            } else {
              this._resetEditingVariables();
              this.map.setInfoWindowOnClick(true);
              if (this.config.editor.removeOnSave === true) {
                var layer = feature.getLayer();
                // perform a new query
                var query = new Query();
                query.objectIds = [feature.attributes[layer.objectIdField]];
                var curidx = this.attrInspector._selection.indexOf(feature);
                layer.selectFeatures(query, FeatureLayer.SELECTION_SUBTRACT, lang.hitch(this, this._feature_removed(feature, curidx)));
              } else {
                // reselect the feature
                if (this.currentFeature.hasOwnProperty("allowDelete")) {
                  this._toggleDeleteButton(this.currentFeature.allowDelete && this.currentLayerInfo.allowDelete);
                } else {
                  this._toggleDeleteButton(this.currentLayerInfo.allowDelete && this.currentLayerInfo.configFeatureLayer.layerAllowsDelete);
                }
                this._toggleEditGeoSwitch(this.currentLayerInfo.disableGeometryUpdate || !this.currentLayerInfo.configFeatureLayer.layerAllowsUpdate);
                //|| this.currentLayerInfo.featureLayer.hasZ || this.currentLayerInfo.featureLayer.hasM

                feature.setSymbol(this._getSelectionSymbol(feature.getLayer().geometryType, true));
              }
            }
            deferred.resolve("success");
          }
          array.forEach(processIndicators, function (processIndicator) {
            if (domClass.contains(processIndicator, "busy")) {
              domClass.remove(processIndicator, "busy");
            }
          });
          array.forEach(processIndicatorsPanel, function (processIndicator) {
            if (domClass.contains(processIndicator, "busy")) {
              domClass.remove(processIndicator, "busy");
            }
          });
          if (domClass.contains(saveBtn, "hide")) {
            domClass.remove(saveBtn, "hide");
          }
        }), lang.hitch(this, function () {
          array.forEach(processIndicators, function (processIndicator) {
            if (domClass.contains(processIndicator, "busy")) {
              domClass.remove(processIndicator, "busy");
            }
          });
          array.forEach(processIndicatorsPanel, function (processIndicator) {
            if (domClass.contains(processIndicator, "busy")) {
              domClass.remove(processIndicator, "busy");
            }
          });
          if (domClass.contains(saveBtn, "hide")) {
            domClass.remove(saveBtn, "hide");
          }
          //deferred.resolve("failed");
        }));
      }
      //else
      //{
      //  this._formatErrorFields(errorObj);

      //  deferred.resolve("failed");
      //}
      return deferred.promise;
    },

    _showTemplate: function _showTemplate(showTemplate) {
      this._attrInspIsCurrentlyDisplayed = !showTemplate;
      if (showTemplate) {
        this._mapClickHandler(true);
        this._showTemplatePicker();

        // esriBundle.widgets.attachmentEditor.NLS_attachments = this._orignls;
      } else {
        //esriBundle.widgets.attachmentEditor.NLS_attachments = this._orignls + " " + this.nls.attachmentSaveDeleteWarning;
        this._mapClickHandler(false);
        //show attribute inspector
        query(".jimu-widget-smartEditor-ecan .templatePickerMainDiv")[0].style.display = "none";
        query(".jimu-widget-smartEditor-ecan .attributeInspectorMainDiv")[0].style.display = "block";

        if (this.attrInspector) {

          if (!this.currentFeature) {
            this.attrInspector.first();
          }
          this._createSmartAttributes();
          this._createAttributeInspectorTools();
          this.attrInspector.refresh();

          /* BEGIN CHANGE - Configure feature editing tools */
          this._createFeatureEditTools();

          /* END CHANGE */

          var attTable = query("td.atiLabel", this.attrInspector.domNode);
          var presets = this._getPresetValues();
          array.forEach(presets, lang.hitch(this, function (preset) {
            if (attTable !== undefined && attTable !== null) {
              var fieldName = preset.fieldName;
              var row = dojo.filter(attTable, lang.hitch(this, function (row) {
                if (row.childNodes) {
                  if (row.childNodes.length > 0) {
                    //if (this.useFieldName === true) {
                    if (row.hasAttribute("data-fieldname")) {
                      return row.getAttribute("data-fieldname") === fieldName;
                    } else {
                      return row.childNodes[0].data === fieldName;
                    }
                  }
                  //else {
                  //  return row.childNodes[0].data === fieldName;
                  //}
                  //}
                }
                return false;
              }));

              var nl = null;
              if (row !== null) {
                if (row.length > 0) {
                  var rowInfo = this._getRowInfo(row[0]);

                  var valueCell = rowInfo[0];
                  var valueCell2 = rowInfo[4];
                  var parent = rowInfo[1];
                  var widget = rowInfo[2];
                  domClass.add(parent, "hideField");
                }
              }
            }
          }));

          this._attributeInspectorTools.triggerFormValidation();
          //this._sytleFields(this.attrInspector);
          if (this.currentFeature.getLayer().originalLayerId) {
            this._enableAttrInspectorSaveButton(this._validateAttributes());
          } else {
            this._enableAttrInspectorSaveButton(false);
          }
          if (this.currentLayerInfo.editDescription && this.currentLayerInfo.editDescription !== null) {
            this.editDescription.innerHTML = this.currentLayerInfo.editDescription;
            this.editDescription.style.display = "block";
          } else {
            this.editDescription.style.display = "none";
          }
          if (this.currentLayerInfo.isCache && this.currentLayerInfo.isCache === true) {
            this._toggleEditGeoSwitch(false);
          } else {
            this._toggleEditGeoSwitch(this.currentLayerInfo.disableGeometryUpdate || !this.currentLayerInfo.configFeatureLayer.layerAllowsUpdate);
            //|| this.currentLayerInfo.featureLayer.hasZ || this.currentLayerInfo.featureLayer.hasM
          }
          this._addWarning();
        }
        this._recordLoadeAttInspector();
      }
    },
    _createAttributeInspectorTools: function _createAttributeInspectorTools() {
      if (this.currentFeature === undefined || this.currentFeature === null) {
        return;
      }
      var attTable = query("td.atiLabel", this.attrInspector.domNode);
      if (attTable === undefined || attTable === null) {
        return;
      }
      var attributeInspectorToolsParams = {
        _attrInspector: this.attrInspector,
        _feature: this.currentFeature,
        _fieldInfo: this.currentLayerInfo.fieldInfos
      };
      this._attributeInspectorTools = new attributeInspectorTools(attributeInspectorToolsParams);
    },

    _createFeatureEditTools: function _createFeatureEditTools() {
      if (this.currentFeature === undefined || this.currentFeature === null) {
        return;
      }

      // Prepare merge tool
      this._createMergeTool();

      // Prepare explode tool
      this._createExplodeTool();

      // Prepare cut tool
      this._createCutTool();
    },

    _createMergeTool: function _createMergeTool() {
      // Merge Button - verify multple features selected from a single dataset
      var selLayers = [];
      array.forEach(this.updateFeatures, lang.hitch(this, function (feature) {
        var layer = feature.getLayer();
        if (selLayers && selLayers.indexOf(layer.id) === -1) {
          selLayers.push(layer.id);
        }
      }));

      if (selLayers.length !== 1) {
        // Disable the merge tool and show multi layer error message value
        this._setMergeHandler(false, "multiple layers");
        return;
      }

      // Check geometry is line or polygon
      if (this.currentFeature.geometry.type === 'point') {
        // Disable the merge tool and show unsupported geometry error message value
        this._setMergeHandler(false, "unsupported geometry");
        return;
      }

      // Ensure multiple features
      if (this.updateFeatures.length === 1) {
        // Disable the merge tool and show requires two or more error message value
        this._setMergeHandler(false, "number of features");
      } else {
        this._setMergeHandler(true);
      }
    },

    _createExplodeTool: function _createExplodeTool() {
      // Check geometry is line or polygon
      if (this.currentFeature.geometry.type === 'point') {
        // Disable the explode tool and show unsupported geometry error message value
        this._setExplodeHandler(false, "unsupported geometry");
        return;
      }

      // Check for multipart geometry
      var feature = null,
          process = '',
          geometry = null,
          newFeatures = [];
      feature = this.currentFeature;
      switch (feature.geometry.type) {
        case 'polyline':
          if (feature.geometry.paths.length > 0) process = 'paths';
          break;

        case 'polygon':
          if (feature.geometry.rings.length > 0) process = 'rings';
          break;

        default:
          break;
      }

      if (feature.geometry[process].length === 1) {
        // Disable the explode tool and show not multipart error message value
        this._setExplodeHandler(false, "not multipart");
      } else {
        this._setExplodeHandler(true);
      }
    },

    _createCutTool: function _createCutTool() {
      // Check geometry is line or polygon
      if (this.currentFeature.geometry.type === 'point') {
        // Disable the explode tool and show unsupported geometry error message value
        this._setCutHandler(false, "unsupported geometry");
      } else {
        this._setCutHandler(true);
      }
    },

    _createSmartAttributes: function _createSmartAttributes() {
      if (this.currentFeature === undefined || this.currentFeature === null) {
        return;
      }
      var attTable = query("td.atiLabel", this.attrInspector.domNode);
      if (attTable === undefined || attTable === null) {
        return;
      }
      var fieldValidation = null;
      if (this.currentLayerInfo !== undefined && this.currentLayerInfo !== null) {
        if (this.currentLayerInfo.fieldValidations !== undefined && this.currentLayerInfo.fieldValidations !== null) {
          fieldValidation = this.currentLayerInfo.fieldValidations;
        }
      }
      if (fieldValidation === null) {
        return;
      }

      var smartAttParams = {
        _attrInspector: this.attrInspector,
        _fieldValidation: fieldValidation,
        _feature: this.currentFeature,
        _fieldInfo: this.currentLayerInfo.fieldInfos
      };
      this._smartAttributes = new smartAttributes(smartAttParams);
    },

    _showTemplatePicker: function _showTemplatePicker() {
      // hide the attr inspector and show the main template picker div
      query(".jimu-widget-smartEditor-ecan .attributeInspectorMainDiv")[0].style.display = "none";
      query(".jimu-widget-smartEditor-ecan .templatePickerMainDiv")[0].style.display = "block";

      if (this.templatePicker) {
        if (this.config.editor.hasOwnProperty("keepTemplateSelected")) {
          if (this.config.editor.keepTemplateSelected !== true) {
            this.templatePicker.clearSelection();
          }
        } else {
          this.templatePicker.clearSelection();
        }
        if (this.templatePicker) {
          var override = null;
          if (this.drawingTool && this.currentDrawType) {
            override = this.currentDrawType;
          }
          this._activateTemplateToolbar(override);
          this.templatePicker.update();
        }
      }
      this._resetEditingVariables();

      var layersRefresh = [];
      if (this.updateFeatures) {
        array.forEach(this.updateFeatures, lang.hitch(this, function (feature) {
          var layer = feature.getLayer();
          if (layersRefresh && layersRefresh.indexOf(layer.id) === -1) {
            layersRefresh.push(layer.id);
            layer.clearSelection();
            layer.refresh();
          }
        }));
      }
      if (this.currentFeature) {
        var layer = this.currentFeature.getLayer();
        if (layersRefresh && layersRefresh.indexOf(layer.id) === -1) {
          layersRefresh.push(layer.id);
          layer.clearSelection();
          layer.refresh();
        }
      }
      this.currentFeature = null;
      this.geometryChanged = false;
      this.currentLayerInfo = null;
      this._removeLocalLayers();
      if (this._recreateOnNextShow === true) {
        this._recreateOnNextShow = false;
        this._createEditor();
      }
      if (this._creationDisabledOnAll) {
        if (this.templatePicker) {
          dojo.style(this.templatePicker.domNode, "display", "none");
        }
        if (this.drawingTool) {
          dojo.style(this.drawingTool.domNode, "display", "none");
        }
      } else {
        if (this.templatePicker) {
          dojo.style(this.templatePicker.domNode, "display", "block");
        }
        if (this.drawingTool) {
          dojo.style(this.drawingTool.domNode, "display", "block");
        }
      }
    },

    _setPresetValue: function _setPresetValue() {
      var sw = registry.byId("savePresetValueSwitch");
      this._usePresetValues = sw.checked;
    },

    _toggleUsePresetValues: function _toggleUsePresetValues(checked) {
      var sw = registry.byId("savePresetValueSwitch");
      sw.set('checked', checked === null ? !sw.checked : checked);
      this._usePresetValues = sw.checked;
    },

    _turnEditGeometryToggleOff: function _turnEditGeometryToggleOff() {

      if (this._editGeomSwitch && this._editGeomSwitch.checked) {
        if (this.editToolbar) {
          if (this.editToolbar.getCurrentState().tool !== 0) {
            this.editToolbar.deactivate();
          }
        }
        this._editingEnabled = false;
        this._ignoreEditGeometryToggle = true;
        this._editGeomSwitch.set("checked", false);
        this.map.setInfoWindowOnClick(true);
        setTimeout(lang.hitch(this, function () {
          this._ignoreEditGeometryToggle = false;
        }), 2);
      }
    },

    _validateFeatureChanged: function _validateFeatureChanged() {

      if (this.currentFeature) {

        if (this.geometryChanged !== undefined && this.geometryChanged !== null && this.geometryChanged === true) {
          return true;
        }
        var result = this._changed_feature(this.currentFeature, true);
        var feature = result[0];
        var type = result[2];
        if (feature !== null) {
          if (Object.keys(feature.attributes).length === 0 && type !== "Add") {
            return false;
          }
        }
      }
      return true;
    },

    // todo: modify to feature as input parameter?
    _validateRequiredFields: function _validateRequiredFields() {
      var errorObj = {};

      if (!this.currentFeature) {
        return errorObj;
      }

      var layer = this.currentFeature.getLayer();

      var filteredFields = array.filter(layer.fields, lang.hitch(this, function (field) {
        return field.nullable === false && field.editable === true;
      }));

      array.forEach(filteredFields, lang.hitch(this, function (f) {
        if (this.currentFeature.attributes[f.name] === "undefined") {
          errorObj[f.alias] = "undefined";
        } else if (this.currentFeature.attributes[f.name] === null) {
          errorObj[f.alias] = "null";
        } else {
          switch (f.type) {
            case "esriFieldTypeString":
              if (this.currentFeature.attributes[f.name] === "" || this.currentFeature.attributes[f.name] && this.currentFeature.attributes[f.name].trim() === "") {
                errorObj[f.alias] = "Empty string";
              }
              break;
            default:
              break;
          }
        }
      }));
      return errorObj;
    },

    _worksAfterClose: function _worksAfterClose() {
      // restore the default string of mouse tooltip
      esriBundle.toolbars.draw.start = this._defaultStartStr;
      esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;

      // show lable layer.
      //var labelLayer = this.map.getLayer("labels");
      //if (labelLayer) {
      //  labelLayer.show();
      //}
    },

    _workBeforeCreate: function _workBeforeCreate() {
      // change string of mouse tooltip
      var additionStr = "<br/>" + "(" + this.nls.pressStr + "<b>" + this.nls.ctrlStr + "</b> " + this.nls.snapStr + ")";
      this._defaultStartStr = esriBundle.toolbars.draw.start;
      this._defaultAddPointStr = esriBundle.toolbars.draw.addPoint;
      esriBundle.toolbars.draw.start = esriBundle.toolbars.draw.start + additionStr;
      esriBundle.toolbars.draw.addPoint = esriBundle.toolbars.draw.addPoint + additionStr;

      // hide label layer.
      //var labelLayer = this.map.getLayer("labels");
      //if (labelLayer) {
      //  labelLayer.hide();
      //}
    },

    _getDefaultFieldInfos: function _getDefaultFieldInfos(layerObject) {
      // summary:
      //  filter webmap fieldInfos.
      // description:
      //   return null if fieldInfos has not been configured in webmap.
      //layerObject = this.map.getLayer(layerInfo.featureLayer.id);
      var fieldInfos = editUtils.getFieldInfosFromWebmap(layerObject.id, this._jimuLayerInfos); //
      if (fieldInfos === undefined || fieldInfos === null) {
        fieldInfos = editUtils.getFieldInfosLayer(layerObject.id, this._jimuLayerInfos);
      }
      if (fieldInfos) {
        fieldInfos = array.filter(fieldInfos, function (fieldInfo) {
          return fieldInfo.visible || fieldInfo.isEditable;
        });
      }
      return fieldInfos;
    },

    _getDefaultLayerInfos: function _getDefaultLayerInfos() {
      var defaultLayerInfos = [];
      var fieldInfos;
      for (var i = this.map.graphicsLayerIds.length - 1; i >= 0; i--) {
        var layerObject = this.map.getLayer(this.map.graphicsLayerIds[i]);
        if (layerObject.type === "Feature Layer" && layerObject.url) {
          var layerInfo = {
            featureLayer: {}
          };
          layerInfo.featureLayer.id = layerObject.id;
          layerInfo.disableGeometryUpdate = false;
          layerInfo.allowUpdateOnly = false; //
          fieldInfos = this._getDefaultFieldInfos(layerObject);
          if (fieldInfos && fieldInfos.length > 0) {
            layerInfo.fieldInfos = fieldInfos;
          }
          defaultLayerInfos.push(layerInfo);
        }
      }
      return defaultLayerInfos;
    },

    _converConfiguredLayerInfos: function _converConfiguredLayerInfos(layerInfos) {
      array.forEach(layerInfos, function (layerInfo) {
        // convert layerInfos to compatible with old version
        var layerObject;
        if (!layerInfo.featureLayer.id && layerInfo.featureLayer.url) {
          layerObject = this.getLayerObjectFromMapByUrl(this.map, layerInfo.featureLayer.url);
          if (layerObject) {
            layerInfo.featureLayer.id = layerObject.id;
          }
        } else {
          layerObject = this.map.getLayer(layerInfo.featureLayer.id);
        }
        var layID = layerInfo.featureLayer.id;
        if (layerInfo.featureLayer.hasOwnProperty("originalLayerId")) {
          layID = layerInfo.featureLayer.originalLayerId;
        }
        if (layerObject) {
          // convert fieldInfos
          var newFieldInfos = [];
          var webmapFieldInfos = editUtils.getFieldInfosFromWebmap(layID, this._jimuLayerInfos);
          if (webmapFieldInfos === undefined || webmapFieldInfos === null) {
            webmapFieldInfos = editUtils.getFieldInfosLayer(layID, this._jimuLayerInfos);
          }
          array.forEach(webmapFieldInfos, function (webmapFieldInfo) {
            if (webmapFieldInfo.fieldName !== layerObject.globalIdField && webmapFieldInfo.fieldName !== layerObject.objectIdField && webmapFieldInfo.type !== "esriFieldTypeGeometry" && webmapFieldInfo.type !== "esriFieldTypeOID" && webmapFieldInfo.type !== "esriFieldTypeBlob" && webmapFieldInfo.type !== "esriFieldTypeGlobalID" && webmapFieldInfo.type !== "esriFieldTypeRaster" && webmapFieldInfo.type !== "esriFieldTypeXML") {
              //var found = array.some(layerInfo.fieldInfos, function (fieldInfo) {
              //  return (webmapFieldInfo.fieldName === fieldInfo.fieldName);
              //});
              //if (found === true) {
              var webmapFieldInfoNew = this.getFieldInfoFromWebmapFieldInfos(webmapFieldInfo, layerInfo.fieldInfos);

              if (webmapFieldInfoNew.visible === true) {
                newFieldInfos.push(webmapFieldInfoNew);
              }
            }
          }, this);

          if (newFieldInfos.length !== 0) {
            layerInfo.fieldInfos = newFieldInfos;
          }
          //layerInfo = this._modifyFieldInfosForEE(layerInfo);
          //layerInfo.fieldInfo = this._processFieldInfos(layerInfo.fieldInfo);
        }
      }, this);
      return layerInfos;
    },

    getLayerObjectFromMapByUrl: function getLayerObjectFromMapByUrl(map, layerUrl) {
      var resultLayerObject = null;
      for (var i = 0; i < map.graphicsLayerIds.length; i++) {
        var layerObject = map.getLayer(map.graphicsLayerIds[i]);
        if (layerObject.url.toLowerCase() === layerUrl.toLowerCase()) {
          resultLayerObject = layerObject;
          break;
        }
      }
      return resultLayerObject;
    },

    getFieldInfoFromWebmapFieldInfos: function getFieldInfoFromWebmapFieldInfos(webmapFieldInfo, fieldInfos) {
      var foundInfo = {};
      var foundInfos = array.filter(fieldInfos, function (fieldInfo) {
        return webmapFieldInfo.fieldName === fieldInfo.fieldName;
      });
      if (foundInfos) {
        if (foundInfos.length >= 1) {
          foundInfo = foundInfos[0];
        } else {
          foundInfo = webmapFieldInfo;
        }
      }
      foundInfo.label = foundInfo.label === undefined ? webmapFieldInfo.label : foundInfo.label;

      foundInfo.visible = foundInfo.visible === undefined ? webmapFieldInfo.visible : foundInfo.visible;

      foundInfo.isEditableSettingInWebmap = webmapFieldInfo.isEditable === undefined ? true : webmapFieldInfo.isEditable;

      foundInfo.isEditable = foundInfo.isEditable === undefined ? webmapFieldInfo.isEditable : foundInfo.isEditable;

      foundInfo.canPresetValue = foundInfo.canPresetValue === undefined ? false : foundInfo.canPresetValue;

      foundInfo.format = webmapFieldInfo.format === undefined ? null : webmapFieldInfo.format;

      for (var k in webmapFieldInfo) {
        if (webmapFieldInfo.hasOwnProperty(k)) {
          if (foundInfo.hasOwnProperty(k) === false) {
            foundInfo[k] = webmapFieldInfo[k];
          }
        }
      }
      return foundInfo;
    },

    getConfigDefaults: function getConfigDefaults() {
      if (this.config.editor.hasOwnProperty("editGeometryDefault") && this.config.editor.editGeometryDefault === true) {
        setTimeout(lang.hitch(this, function () {
          this._editGeomSwitch.set('checked', true);
        }), 100);
      } else {
        this._turnEditGeometryToggleOff();
      }
    },

    _processConfig: function _processConfig() {
      this.config.editor.configInfos = array.filter(this.config.editor.configInfos, function (configInfo) {
        if (configInfo._editFlag && configInfo._editFlag === true) {
          return true;
        } else {
          return false;
        }
      });
      array.forEach(this.config.editor.configInfos, function (configInfo) {

        var layerObject = configInfo.layerInfo.layerObject;
        if (layerObject && layerObject.isEditable && layerObject.isEditable()) {
          if (configInfo.allowUpdateOnly === false) {
            this.own(on(layerObject, "visibility-change, scale-visibility-change", lang.hitch(this, function () {
              //console.log("layer change" + state);
              this._createEditor();
            })));
          }
          // modify templates with space in string fields
          this._removeSpacesInLayerTemplates(layerObject);
          this.processConfigForRuntime(configInfo);
          configInfo.configFeatureLayer = configInfo.featureLayer;
          configInfo.featureLayer = layerObject;
          configInfo.showDeleteButton = false;
        }
      }, this);
    },

    onClose: function onClose() {
      this._worksAfterClose();

      //if (this.config.editor.clearSelectionOnClose) {
      //  if (this._isDirty) {
      //    this._promptToResolvePendingEdit(true).then(lang.hitch(this, function () {
      //      // set this variable for controlling the onMapClick (#494)
      //      this.map.setInfoWindowOnClick(true);
      //      this._attrInspIsCurrentlyDisplayed = true;
      //      this.templatePicker.clearSelection();
      //    }))

      //  } else {
      //    this._cancelEditingFeature(true);

      //    // set this variable for controlling the onMapClick
      //    this.map.setInfoWindowOnClick(true);
      //    this._attrInspIsCurrentlyDisplayed = true;
      //    this.templatePicker.clearSelection();
      //  }
      //} else
      //{
      this._mapClickHandler(false);
      this._removeLayerVisibleHandler();
      //}
      // close method will call onDeActive automaticlly
      // so do not need to call onDeActive();
    },

    _update: function _update() {
      //if (this.templatePicker) {
      //comments out, this results in teh scroll bar disappearing, unsure why


      //var widgetBox = html.getMarginBox(this.domNode);
      //var height = widgetBox.h;
      //var width = widgetBox.w;


      //var cols = Math.floor(width / 60);
      //this.templatePicker.attr('columns', cols);
      //this.templatePicker.update(true);


      // }
    },

    resize: function resize() {
      this._update();
    },

    onNormalize: function onNormalize() {
      setTimeout(lang.hitch(this, this._update), 100);
    },

    onMinimize: function onMinimize() {
      console.log("min");
    },

    onMaximize: function onMaximize() {
      setTimeout(lang.hitch(this, this._update), 100);
    }

  }, _defineProperty(_declare, 'resize', function resize() {
    console.log('SmartEditorEcan::resize');
    this._update();
  }), _defineProperty(_declare, '_setLinkInfo', function _setLinkInfo() {
    console.log('SmartEditorEcan::_setLinkInfo');
    this._links = this.config.links || [];
  }), _defineProperty(_declare, '_updateLinksUI', function _updateLinksUI() {
    if (!this._links || this._links.length == 0) {
      domConstruct.destroy(this.linksDiv);
    } else {
      // Destroy the old links if any
      if (this._linkControls) {
        array.forEach(this._linkControls, lang.hitch(this, function (linkControl) {
          linkControl.destroy();
        }));
      } else {
        this._linkControls = [];
      }

      // Populate the links
      var fieldValues = this._getPresetValues();

      //Append url parameters
      var loc = window.location;
      var urlObject = esriUrlUtils.urlToObject(loc.href);

      // Check for filter
      if (urlObject.query !== null) {
        for (var key in urlObject.query) {
          fieldValues.push({
            "fieldName": key,
            "value": urlObject.query[key]
          });
        }
      }

      array.forEach(this._links, lang.hitch(this, function (linkConfig) {
        var link = new OperationLink({
          item: linkConfig,
          fieldValues: fieldValues
        });

        link.placeAt(this.linksTableNode);
        link.startup();
        this._linkControls.push(link);
      }));
      this.resize();
    }
  }), _defineProperty(_declare, 'copyFeatureSet', function copyFeatureSet(featureSet) {
    // Get geometry type and ensure editable layer of this geometry type is available
    var geometryType = featureSet.geometryType;
    if (!geometryType) {
      geometryType = featureSet.features[0].geometry.type;
    }
    geometryType = this._getEsriGeometryType(geometryType);

    var layers = this._getEditableLayers(this.config.editor.configInfos, false);
    layers = layers.filter(function (layer) {
      return layer.geometryType && layer.geometryType === geometryType;
    });

    var copyPopup, param;
    param = {
      map: this.map,
      nls: this.nls,
      config: this.config,
      featureSet: featureSet,
      layers: layers
    };

    copyPopup = new CopyFeaturesPopup(param);
    copyPopup.startup();

    copyPopup.onOkClick = lang.hitch(this, function () {
      var template = copyPopup.getSelectedTemplate();
      if (template) {
        if (copyPopup.featureSet.features.length === 1) {
          this._addFeature(copyPopup.featureSet.features[0], template);
        } else {
          this._bulkAddFeatures(copyPopup.featureSet.features, template);
        }
      }
      copyPopup.popup.close();
    });
  }), _defineProperty(_declare, '_getEsriGeometryType', function _getEsriGeometryType(geometryType) {
    var esriGeometryType = '';
    switch (geometryType) {
      case 'polygon':
        esriGeometryType = 'esriGeometryPolygon';
        break;

      case 'polyline':
        esriGeometryType = 'esriGeometryPolyline';
        break;

      case 'point':
        esriGeometryType = 'esriGeometryPoint';
        break;

      default:
        esriGeometryType = geometryType;
        break;
    }
    return esriGeometryType;
  }), _defineProperty(_declare, '_addFeature', function _addFeature(feature, template) {
    // COPY OF CODE FROM _addGraphicToLocalLayer FUNCTION
    var newTempLayerInfos;
    var localLayerInfo = null;

    if (this.attrInspector) {
      this.attrInspector.destroy();
      this.attrInspector = null;
    }

    if (this._attachmentUploader && this._attachmentUploader !== null) {
      this._attachmentUploader.clear();
    }

    this._removeLocalLayers();
    // preparation for a new attributeInspector for the local layer
    this.cacheLayer = this._cloneLayer(template.featureLayer);
    this.cacheLayer.setSelectionSymbol(this._getSelectionSymbol(this.cacheLayer.geometryType, true));

    localLayerInfo = this._getLayerInfoForLocalLayer(this.cacheLayer);
    newTempLayerInfos = [localLayerInfo]; //this._converConfiguredLayerInfos([localLayerInfo]);

    this._createAttributeInspector([localLayerInfo]);

    if (this.config.editor.hasOwnProperty("editGeometryDefault") && this.config.editor.editGeometryDefault === true) {
      setTimeout(lang.hitch(this, function () {
        this._editGeomSwitch.set('checked', true);
      }), 100);
    }

    var newAttributes = lang.clone(template.template.prototype.attributes);
    if (this._copyExistingValues) {
      this._modifyAttributesWithCopyValues(newAttributes, newTempLayerInfos, feature.attributes);
    }

    if (this._usePresetValues) {
      this._modifyAttributesWithPresetValues(newAttributes, newTempLayerInfos[0]);
    }

    var newGraphic = new Graphic(feature.geometry, null, newAttributes);

    // store original attrs for later use
    newGraphic.preEditAttrs = JSON.parse(JSON.stringify(newGraphic.attributes));
    this.cacheLayer.applyEdits([newGraphic], null, null, lang.hitch(this, function (e) {
      var queryTask = new Query();
      queryTask.objectIds = [e[0].objectId];
      this.cacheLayer.selectFeatures(queryTask, FeatureLayer.SELECTION_NEW);

      this.currentFeature = this.updateFeatures[0] = newGraphic;
      this.getConfigDefaults();
      this.geometryChanged = false;
      if (this._attributeInspectorTools) {
        this._attributeInspectorTools.triggerFormValidation();
      }
      this._attachLayerHandler();
      this.currentLayerInfo = this._getLayerInfoByID(this.currentFeature._layer.id);
      this.currentLayerInfo.isCache = true;
      this._toggleDeleteButton(false);
      //this._toggleEditGeoSwitch(false);

      //this._createSmartAttributes();
      //
      this._enableAttrInspectorSaveButton(this._validateAttributes());
    }));

    this._showTemplate(false, false);

    if (this.config.editor.hasOwnProperty("autoSaveEdits") && this._autoSaveRuntime === true) {
      setTimeout(lang.hitch(this, function () {
        var saveBtn = query(".saveButton")[0];
        if (!saveBtn) {
          //do nothing
        } else {
          on.emit(saveBtn, 'click', { cancelable: true, bubbles: true });
        }
      }), 100);
    }
  }), _defineProperty(_declare, '_bulkAddFeatures', function _bulkAddFeatures(featureSet, template) {
    // COPY OF CODE FROM _addGraphicToLocalLayer FUNCTION
    var newTempLayerInfos;
    var localLayerInfo = null;

    if (this.attrInspector) {
      this.attrInspector.destroy();
      this.attrInspector = null;
    }

    if (this._attachmentUploader && this._attachmentUploader !== null) {
      this._attachmentUploader.clear();
    }

    if (this._attachmentUploader && this._attachmentUploader !== null) {
      this._attachmentUploader.clear();
    }

    this._removeLocalLayers();
    // preparation for a new attributeInspector for the local layer
    this.cacheLayer = this._cloneLayer(template.featureLayer);
    this.cacheLayer.setSelectionSymbol(this._getSelectionSymbol(this.cacheLayer.geometryType, true));

    localLayerInfo = this._getLayerInfoForLocalLayer(this.cacheLayer);
    newTempLayerInfos = [localLayerInfo]; //this._converConfiguredLayerInfos([localLayerInfo]);

    this._createAttributeInspector([localLayerInfo]);

    if (this.config.editor.hasOwnProperty("editGeometryDefault") && this.config.editor.editGeometryDefault === true) {
      setTimeout(lang.hitch(this, function () {
        this._editGeomSwitch.set('checked', true);
      }), 100);
    }

    var updateFeatures = [];
    array.forEach(featureSet, lang.hitch(this, function (feature) {
      var newAttributes = lang.clone(template.template.prototype.attributes);
      if (this._copyExistingValues) {
        this._modifyAttributesWithCopyValues(newAttributes, newTempLayerInfos, feature.attributes);
      }

      if (this._usePresetValues) {
        this._modifyAttributesWithPresetValues(newAttributes, newTempLayerInfos[0]);
      }

      var newGraphic = new Graphic(feature.geometry, null, newAttributes);

      // store original attrs for later use
      newGraphic.preEditAttrs = JSON.parse(JSON.stringify(newGraphic.attributes));
      updateFeatures.push(newGraphic);
    }));

    this.cacheLayer.applyEdits(updateFeatures, null, null, lang.hitch(this, function (e) {
      var queryTask = new Query();
      var objectIds = e.map(function (feature) {
        return feature.objectId;
      });
      queryTask.objectIds = objectIds;
      this.cacheLayer.selectFeatures(queryTask, FeatureLayer.SELECTION_NEW);

      /*
       this.currentFeature = this.updateFeatures[0] = updateFeatures[0];
      this.getConfigDefaults();
      this.geometryChanged = false;
      if (this._attributeInspectorTools) {
        this._attributeInspectorTools.triggerFormValidation();
      }
      this._attachLayerHandler();
      this.currentLayerInfo = this._getLayerInfoByID(this.currentFeature._layer.id);
      this.currentLayerInfo.isCache = true;
      this._toggleDeleteButton(false);
      //this._toggleEditGeoSwitch(false);
       //this._createSmartAttributes();
      //
      this._enableAttrInspectorSaveButton(this._validateAttributes());
      */
      array.forEach(updateFeatures, lang.hitch(this, function (feature) {
        this._postChanges(feature).then(lang.hitch(this, function (e) {
          if (e === "failed") {} else {}
        }));
      }));

      this._showTemplate(false, false);

      if (this.config.editor.hasOwnProperty("autoSaveEdits") && this._autoSaveRuntime === true) {
        setTimeout(lang.hitch(this, function () {
          var saveBtn = query(".saveButton")[0];
          if (!saveBtn) {
            //do nothing
          } else {
            on.emit(saveBtn, 'click', { cancelable: true, bubbles: true });
          }
        }), 100);
      }
    }));
  }), _defineProperty(_declare, '_modifyAttributesWithCopyValues', function _modifyAttributesWithCopyValues(newAttributes, newTempLayerInfos, attributes) {
    for (var key in newAttributes) {
      // Check if attribute exists in new feature
      if (attributes[key]) {
        // Validate the attribute value is valid for data type
        if (this._validateCopyAttribute(attributes[key], key, newTempLayerInfos[0].fieldInfos)) {
          newAttributes[key] = attributes[key];
        }
      }
    }
  }), _defineProperty(_declare, '_validateCopyAttribute', function _validateCopyAttribute(fieldValue, fieldName, fieldInfos) {
    var isValid = false;
    var field = fieldInfos.filter(function (fieldInfo) {
      return fieldInfo.name === fieldName;
    })[0];

    if (field) {
      // Validate data type
      switch (field.type) {
        case 'esriFieldTypeGUID':
          var pattern = /^\{[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\}$/i;
          if (pattern.test(fieldValue) === true) {
            isValid = true;
          }
          break;

        case "esriFieldTypeInteger":
          var regInt = parseInt(fieldValue);
          if (regInt && regInt >= -2147483648 && regInt <= 2147483647) {
            isValid = true;
          }
          break;

        case "esriFieldTypeSmallInteger":
          var shtInt = parseInt(fieldValue);
          if (shtInt && shtInt >= -32768 && shtInt <= 32767) {
            isValid = true;
          }
          break;

        case "esriFieldTypeSingle":
        case "esriFieldTypeDouble":
          if (Number.isNumeric(fieldValue)) {
            isValid = true;
          }
          break;

        case "esriFieldTypeDate":
          var newDate = new Date(fieldValue);
          isValid = newDate instanceof Date && !isNaN(newDate.valueOf());
          break;

        case 'esriFieldTypeString':
        default:
          isValid = field["length"] >= fieldValue.length;
          break;
      }

      // Check Domain values
      if (field.domain && isValid) {
        switch (field.domain.type) {
          case "codedValue":
            // Validate value is with domain list
            isValid = field.domain.codedValues.filter(function (value) {
              return value.code === fieldValue;
            }).length > 0;
            break;

          case "range":
            var numValue = Number(fieldValue);
            isValid = field.domain.minValue <= numValue && field.domain.maxValue >= numValue;
            break;

          default:
            break;
        }
      }

      // Check editable
      /* CHANGE 20 MAR 2019 - type of field ediatble */
      if (!field.editable && isValid) {
        isValid = false;
      }
    }

    return isValid;
  }), _defineProperty(_declare, '_setMergeHandler', function _setMergeHandler(create, error) {
    if (create) {
      // Remove disable button style
      if (domClass.contains(this.featureMergeBtnNode, "jimu-state-disabled")) {
        domClass.remove(this.featureMergeBtnNode, "jimu-state-disabled");
      }

      domAttr.set(this.featureMergeBtnNode, "title", this.nls.tools.mergeToolTitle);

      // Apply the click event
      if (!this._mergeClick) {
        this._mergeClick = on(this.featureMergeBtnNode, "click", lang.hitch(this, this._startMerge));
      }
    } else {
      // Apply disable button style
      if (!domClass.contains(this.featureMergeBtnNode, "jimu-state-disabled")) {
        domClass.add(this.featureMergeBtnNode, "jimu-state-disabled");
      }

      // Deactiviate the click event
      if (this._mergeClick) {
        this._mergeClick.remove();
        this._mergeClick = null;
      }

      switch (error) {
        case "multiple layers":
          domAttr.set(this.featureMergeBtnNode, "title", this.nls.tools.mergeErrors.multipleLayersError);
          break;

        case "unsupported geometry":
          domAttr.set(this.featureMergeBtnNode, "title", this.nls.tools.mergeErrors.unsupportedGeometryError);
          break;

        case "number of features":
          domAttr.set(this.featureMergeBtnNode, "title", this.nls.tools.mergeErrors.numberOfFeaturesError);
          break;

        default:
          domAttr.set(this.featureMergeBtnNode, "title", this.nls.tools.mergeErrors.generalError);
          break;
      }
    }
  }), _defineProperty(_declare, '_startMerge', function _startMerge() {
    var mergePopup, param;
    param = {
      map: this.map,
      nls: this.nls,
      config: this.config,
      features: this.updateFeatures,
      currentFeature: this.currentFeature
    };

    mergePopup = new MergeFeaturesPopup(param);
    mergePopup.startup();

    mergePopup.onOkClick = lang.hitch(this, function () {
      this._mergeFeatures();
      mergePopup.popup.close();
    });
  }), _defineProperty(_declare, '_mergeFeatures', function _mergeFeatures() {
    var geometries = [];
    var removeFeatures = [];
    for (var i = 0, il = this.updateFeatures.length; i < il; i++) {
      var feature = this.updateFeatures[i];
      geometries.push(feature.geometry);

      if (feature !== this.currentFeature) removeFeatures.push(feature);
    }

    var newGeometry = geometryEngine.union(geometries);
    var newFeature = new Graphic(this.currentFeature.toJson());
    newFeature.setGeometry(newGeometry);

    // Apply the changes
    var layer = this.currentFeature.getLayer();
    layer.applyEdits(null, [newFeature], removeFeatures, lang.hitch(this, function (adds, updates, deletes) {
      if (updates && updates.length > 0 && updates[0].hasOwnProperty("error")) {
        Message({
          message: updates[0].error.toString()
        });
      }
      if (deletes && deletes.length > 0 && deletes[0].hasOwnProperty("error")) {
        Message({
          message: deletes[0].error.toString()
        });
      }

      this.load_from_featureaction(layer, newFeature);
    }), lang.hitch(this, function (err) {
      Message({
        message: err.message.toString() + "\n" + err.details
      });
    }));
  }), _defineProperty(_declare, '_setExplodeHandler', function _setExplodeHandler(create, error) {
    if (create) {
      // Remove disable button style
      if (domClass.contains(this.featureExplodeBtnNode, "jimu-state-disabled")) {
        domClass.remove(this.featureExplodeBtnNode, "jimu-state-disabled");
      }

      domAttr.set(this.featureExplodeBtnNode, "title", this.nls.tools.explodeToolTitle);

      // Apply the click event
      if (!this._explodeClick) {
        this._explodeClick = on(this.featureExplodeBtnNode, "click", lang.hitch(this, this._startExplode));
      }
    } else {
      // Apply disable button style
      if (!domClass.contains(this.featureExplodeBtnNode, "jimu-state-disabled")) {
        domClass.add(this.featureExplodeBtnNode, "jimu-state-disabled");
      }

      // Deactiviate the click event
      if (this._explodeClick) {
        this._explodeClick.remove();
        this._explodeClick = null;
      }

      switch (error) {
        case "unsupported geometry":
          domAttr.set(this.featureExplodeBtnNode, "title", this.nls.tools.explodeErrors.unsupportedGeometryError);
          break;

        case "not multipart":
          domAttr.set(this.featureExplodeBtnNode, "title", this.nls.tools.explodeErrors.notMultipartError);
          break;

        default:
          domAttr.set(this.featureExplodeBtnNode, "title", this.nls.tools.explodeErrors.generalError);
          break;
      }
    }
  }), _defineProperty(_declare, '_startExplode', function _startExplode() {
    var explodePopup, param;
    param = {
      map: this.map,
      nls: this.nls,
      config: this.config,
      features: this.updateFeatures,
      currentFeature: this.currentFeature
    };

    explodePopup = new ExplodeFeaturesPopup(param);
    explodePopup.startup();

    explodePopup.onOkClick = lang.hitch(this, function () {
      this._explodeFeatures();
      explodePopup.popup.close();
    });
  }), _defineProperty(_declare, '_explodeFeatures', function _explodeFeatures() {
    // Check for multipart geometry
    var feature = null,
        process = '',
        geometry = null,
        newFeatures = [];
    feature = this.currentFeature;
    switch (feature.geometry.type) {
      case 'polyline':
        if (feature.geometry.paths.length > 0) process = 'paths';
        break;

      case 'polygon':
        if (feature.geometry.rings.length > 0) process = 'rings';
        break;

      default:
        break;
    }

    if (process !== '') {
      geometry = feature.geometry;
      for (var p = 0, pl = geometry[process].length; p < pl; p++) {
        var newFeature = new Graphic(feature.toJson());
        var newGeometry = null;

        switch (process) {
          case 'rings':
            newGeometry = new Polygon({
              "rings": [JSON.parse(JSON.stringify(geometry[process][p]))],
              "spatialReference": geometry.spatialReference.toJson()
            });
            break;

          case 'paths':
            newGeometry = new Polyline({
              "paths": [JSON.parse(JSON.stringify(geometry[process][p]))],
              "spatialReference": geometry.spatialReference.toJson()
            });
            break;
        }
        newFeature.setGeometry(newGeometry);
        newFeatures.push(newFeature);
      }
    } else {
      newFeatures.push(feature);
    }

    // Apply the changes
    var layer = this.currentFeature.getLayer();
    layer.applyEdits(newFeatures, null, [feature], lang.hitch(this, function (adds, updates, deletes) {
      if (adds && updates.length > 0 && adds[0].hasOwnProperty("error")) {
        Message({
          message: adds[0].error.toString()
        });
      }
      if (deletes && deletes.length > 0 && deletes[0].hasOwnProperty("error")) {
        Message({
          message: deletes[0].error.toString()
        });
      }

      // Return to templates 
      this._showTemplate(true);
    }), lang.hitch(this, function (err) {
      Message({
        message: err.message.toString() + "\n" + err.details
      });
    }));
  }), _defineProperty(_declare, '_applyEditToolButtonStyle', function _applyEditToolButtonStyle(tool, active) {
    // Update cut tool state
    if (tool !== 'CUT' || tool === 'CUT' && !active) {
      if (domClass.contains(this.featureCutBtnNode, "btn-toggle")) {
        domClass.remove(this.featureCutBtnNode, "btn-toggle");
      }
    } else {
      if (!domClass.contains(this.featureCutBtnNode, "btn-toggle")) {
        domClass.add(this.featureCutBtnNode, "btn-toggle");
      }
    }
  }), _defineProperty(_declare, '_actionEditTool', function _actionEditTool(evt) {
    switch (this._drawToolEditType) {
      case 'CUT':
        this._cutFeatures(evt);
        break;
      default:
        alert('_actionEditTool: Not finished');
        break;
    }
  }), _defineProperty(_declare, '_setCutHandler', function _setCutHandler(create, error) {
    if (create) {
      // Remove disable button style
      if (domClass.contains(this.featureCutBtnNode, "jimu-state-disabled")) {
        domClass.remove(this.featureCutBtnNode, "jimu-state-disabled");
      }

      domAttr.set(this.featureCutBtnNode, "title", this.nls.tools.cutToolTitle);

      // Apply the click event
      if (!this._cutClick) {
        this._cutClick = on(this.featureCutBtnNode, "click", lang.hitch(this, this._setCutMode));
      }
    } else {
      // Apply disable button style
      if (!domClass.contains(this.featureCutBtnNode, "jimu-state-disabled")) {
        domClass.add(this.featureCutBtnNode, "jimu-state-disabled");
      }

      // Deactiviate the click event
      if (this._cutClick) {
        this._cutClick.remove();
        this._cutClick = null;
      }

      switch (error) {
        case "unsupported geometry":
          domAttr.set(this.featureCutBtnNode, "title", this.nls.tools.cutErrors.unsupportedGeometryError);
          break;

        default:
          domAttr.set(this.featureCutBtnNode, "title", this.nls.tools.cutErrors.generalError);
          break;
      }
    }
  }), _defineProperty(_declare, '_setCutMode', function _setCutMode(reset) {
    if (reset === true || this._drawToolEditMode && this._drawToolEditType && this._drawToolEditType === 'CUT') {
      // Deactivate the cut tool
      this._drawToolEditMode = false;
      this._drawToolEditType = null;
      this.drawToolbar.deactivate();

      this.map.setInfoWindowOnClick(true);

      // Remove active style on button
      this._applyEditToolButtonStyle('CUT', false);
    } else {

      // Check if another edit tool is active
      if (this._drawToolEditType !== 'CUT') {}
      // disable this tool


      // Activate the draw tool to define the cut line
      this._drawToolEditType = 'CUT';
      this._drawToolEditMode = true;
      this.drawToolbar.activate(Draw.POLYLINE, null);

      this.map.setInfoWindowOnClick(false);

      // Remove active style on button
      this._applyEditToolButtonStyle('CUT', true);
    }
  }), _defineProperty(_declare, '_cutFeatures', function _cutFeatures(evt) {
    // Check for line feature
    if (this.currentFeature && evt && evt.geometry) {
      var cutLine = evt.geometry;

      // Reset the cut tool
      this._setCutMode(true);

      if (cutLine.type !== 'polyline') {
        Message({
          message: this.nls.tools.cutErrors.invalidCutGeometryError
        });

        // stop here and reset tool
        return;
      }

      var feature = this.currentFeature;
      var newShapes = geometryEngine.cut(feature.geometry, cutLine);

      if (newShapes.length === 0) {
        Message({
          message: this.nls.tools.cutErrors.noFeaturesCutError
        });
      } else {
        // Create new records based on the original and remove the original record
        var newFeatures = [],
            newGeometry = null;
        for (var p = 0, pl = newShapes.length; p < pl; p++) {
          var newFeature = new Graphic(feature.toJson());
          newGeometry = newShapes[p];
          newFeature.setGeometry(newGeometry);
          newFeatures.push(newFeature);
        }

        var layer = feature.getLayer();
        layer.applyEdits(newFeatures, null, [feature], lang.hitch(this, function (adds, updates, deletes) {
          if (adds && updates.length > 0 && adds[0].hasOwnProperty("error")) {
            Message({
              message: adds[0].error.toString()
            });
          }
          if (deletes && deletes.length > 0 && deletes[0].hasOwnProperty("error")) {
            Message({
              message: deletes[0].error.toString()
            });
          }

          // Return to templates 
          this._showTemplate(true);
        }), lang.hitch(this, function (err) {
          Message({
            message: err.message.toString() + "\n" + err.details
          });
        }));
      }
    }
  }), _defineProperty(_declare, '_initURLPresetValues', function _initURLPresetValues() {
    var loc = window.location;
    var urlObject = esriUrlUtils.urlToObject(loc.href);

    // Check for filter
    if (urlObject.query !== null) {
      var valuesQuery = urlObject.query["preset"];
      if (valuesQuery) {
        var values = this._getPresetParams(valuesQuery);
        array.forEach(values, function (field) {
          this._setPresetValueValue(field.name, field.value);
        }, this);
      }
    }
  }), _defineProperty(_declare, '_getPresetParams', function _getPresetParams(query) {
    var presetValues = [];
    if (query) {
      var items = query.split(',');
      array.forEach(items, lang.hitch(this, function (item) {
        var itemparts = item.split(':');
        if (itemparts.length === 2) {
          presetValues.push({
            name: itemparts[0],
            value: itemparts[1]
          });
        }
      }));
    }
    return presetValues;
  }), _defineProperty(_declare, '_applyURLTemplateFilter', function _applyURLTemplateFilter() {
    var loc = window.location;
    var urlObject = esriUrlUtils.urlToObject(loc.href);

    // Check for filter
    if (urlObject.query !== null) {
      var templatesQuery = urlObject.query["templates"] || urlObject.query["TEMPLATES"];
      if (templatesQuery) {
        var templateIDs = this._getTemplateParams(templatesQuery);
        this._filterEditor.filterTextBox.value = templateIDs;
        this._filterEditor._onTemplateFilterChanged();
      }
    }
  }), _defineProperty(_declare, '_getTemplateParams', function _getTemplateParams(query) {
    var templatesString = '';

    var filterParams = query.split(',');

    if (filterParams.length > 0) {
      // Check layer templates for domain codes that match template urls
      var layers = this._getEditableLayers(this.config.editor.configInfos, false);
      var tmps = [],
          tmpIds = [];
      array.forEach(layers, lang.hitch(this, function (layer) {
        var dmVals = layer.types.map(function (item) {
          return {
            "id": item["id"],
            "label": item.templates[0]["name"]
          };
        });

        for (var i = 0, l = dmVals.length; i < l; i++) {
          if (tmpIds.indexOf(dmVals[i].label) === -1) {
            tmps.push(dmVals[i]);
            tmpIds.push(dmVals[i].label);
          } else if (tmpIds.indexOf(dmVals[i].id) === -1) {
            tmps.push(dmVals[i]);
            tmpIds.push(dmVals[i].id);
          }
        }
      }));

      var templates = [];
      array.forEach(filterParams, function (param) {
        var paramlc = param.toLowerCase();
        var options = tmps.filter(function (item, index) {
          return item.id.toLowerCase() === paramlc || item.label.toLowerCase() === paramlc;
        });

        array.forEach(options, function (item) {
          if (templates.indexOf(item.label) === -1) {
            templates.push(item.label);
          }
        });
      });
      templatesString = templates.join(',');
    }

    return templatesString;
  }), _defineProperty(_declare, '_getRowInfo', function _getRowInfo(row) {
    var valueCell = row.parentNode.childNodes[1].childNodes[0];
    var valueCell2 = null;
    if (row.parentNode.childNodes[1].childNodes.length > 1) {
      valueCell2 = row.parentNode.childNodes[1].childNodes[1];
    }
    var label;
    if (this.useFieldName === true) {
      if (row.hasAttribute("data-fieldname")) {
        label = row.getAttribute("data-fieldname");
      } else {
        label = row.childNodes[0].data;
      }
    } else {
      label = row.childNodes[0].data;
    }

    var parent = row.parentNode;
    var widget = registry.getEnclosingWidget(valueCell);

    return [valueCell, parent, widget, label, valueCell2];
  }), _defineProperty(_declare, '_mapAddRemoveLayerHandler', function _mapAddRemoveLayerHandler(action) {

    if (action) {
      if (this._mapAddLayer === undefined || this._mapAddLayer === null) {
        this._mapAddLayer = on(this.map, "layer-add", lang.hitch(this, this._onMapAddLayer));
      }
      if (this._mapRemoveLayer === undefined || this._mapRemoveLayer === null) {
        this._mapRemoveLayer = on(this.map, "layer-remove", lang.hitch(this, this._onMapRemoveLayer));
      }
    } else {
      if (this._mapAddLayer) {
        this._mapAddLayer.remove();
      }
      if (this._mapRemoveLayer) {
        this._mapRemoveLayer.remove();
      }
    }
  }), _defineProperty(_declare, '_onMapAddLayer', function _onMapAddLayer(result) {
    var gl = false;

    switch (result.layer.declaredClass) {
      case "esri.layers.FeatureLayer":
      case "esri.layers.GraphicsLayer":
      case "esri.layers.CSVLayer":
        gl = true;
        break;

      default:
        // Do Nothing
        break;
    }

    if (this.map.snappingManager && gl) {
      // Check if layer existing in snapping manager layer infos
      var isSnap = array.filter(this.map.snappingManager.layerInfos, lang.hitch(this, function (layerInfo) {
        return layerInfo.layer.id === result.layer.id;
      })).length > 0;

      if (!isSnap) {
        var layerInfos = [];
        array.forEach(this.map.snappingManager.layerInfos, function (layerInfo) {
          layerInfos.push(layerInfo);
        });
        layerInfos.push({
          layer: result.layer
        });

        this.map.snappingManager.setLayerInfos(layerInfos);
      }
    }
  }), _defineProperty(_declare, '_onMapRemoveLayer', function _onMapRemoveLayer(result) {
    var gl = false;

    switch (result.layer.declaredClass) {
      case "esri.layers.FeatureLayer":
      case "esri.layers.GraphicsLayer":
      case "esri.layers.CSVLayer":
        gl = true;
        break;

      default:
        // Do Nothing
        break;
    }

    if (this.map.snappingManager && gl) {
      // Check if layer existing in snapping manager layer infos
      var isSnap = array.filter(this.map.snappingManager.layerInfos, lang.hitch(this, function (layerInfo) {
        return layerInfo.layer.id === result.layer.id;
      })).length > 0;

      if (isSnap) {
        var layerInfos = [];
        array.forEach(this.map.snappingManager.layerInfos, function (layerInfo) {
          if (layerInfo.layer.id !== result.layer.id) {
            layerInfos.push(layerInfo);
          }
        });
        this.map.snappingManager.setLayerInfos(layerInfos);
      }
    }
  }), _declare));
});
