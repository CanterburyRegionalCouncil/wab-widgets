///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
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
//
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'jimu/BaseWidgetSetting', 'dojo/_base/lang', 'dojo/_base/html', 'dojo/_base/array', 'dojo/on', 'dojo/keys', 'dojo/dom-style', 'jimu/dijit/Popup', './Edit', '../utils', './GroupSelector', '../BasemapItem', 'dojo/dom', 'dojo/dom-construct', 'dojo/dom-class', 'jimu/dijit/SimpleTable', 'jimu/dijit/LoadingIndicator', 'dijit/form/RadioButton'], function (declare, _WidgetsInTemplateMixin, BaseWidgetSetting, lang, html, array, on, keys, domStyle, Popup, Edit, utils, GroupSelector, BasemapItem, dom, domConstruct, domClass, SimpleTable) {
  var RESPECT_ONLINE = 1,
      CUSTOM_BASEMAP = 2;

  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-basemapgallery-pro-setting',
    basemaps: [],
    mapItems: [],
    edit: null,
    editTr: null,
    popup: null,
    editIndex: null,
    spatialRef: null,

    postMixInProperties: function postMixInProperties() {
      this.inherited(arguments);
      lang.mixin(this.nls, window.jimuNls.common);
      this.nomapTips = this.nls.basemapTips;
      this.nomapTips = this.nomapTips.replace('${import}', '<b>' + this.nls.importBasemap + '</b>');
      this.nomapTips = this.nomapTips.replace('${createNew}', '<b>' + this.nls.createBasemap + '</b>');
    },

    postCreate: function postCreate() {
      this.inherited(arguments);
      this.basemaps = [];
      this.mapItems = [];
      this.tipsSection.innerHTML = this.nomapTips;
      // jimuUtils.combineRadioCheckBoxWithLabel(this.respectOnlineRaido, this.respectOnlineLabel);
      // jimuUtils.combineRadioCheckBoxWithLabel(this.customRaido, this.customLabel);

      this.own(on(this.respectOnlineRaido, 'click', lang.hitch(this, function () {
        if (this.respectOnlineRaido.get('checked')) {
          html.setStyle(this.customBasemapSection, 'display', 'none');
          html.setStyle(this.tipsSection, 'display', 'none');
          html.addClass(this.baseMapsDiv, 'mode-online');
          this.clearBaseMapsDiv();
          this.loadDefaultBasemaps();

          /* BEGIN CHANGE: Groups visibility */

          html.setStyle(this.groupsSection, 'display', 'block');

          /* END CHANGE */
        }
      })));
      this.own(on(this.customRaido, 'click', lang.hitch(this, function () {
        if (this.customRaido.get('checked')) {
          html.setStyle(this.customBasemapSection, 'display', 'block');
          html.setStyle(this.nomapTipsSection, 'display', 'none');
          html.removeClass(this.baseMapsDiv, 'mode-online');
          this.clearBaseMapsDiv();
          this._createMapItems();

          /* BEGIN CHANGE: Groups visibility */

          html.setStyle(this.groupsSection, 'display', 'none');

          /* END CHANGE */
        }
      })));

      /* BEGIN CHANGE: Group option functions */

      this.own(on(this.useGroupsRadio, 'click', lang.hitch(this, function () {
        if (this.useGroupsRadio.get('checked')) {
          //html.setStyle(this.groupsSection, 'display', 'block');
        }
      })));
      this.own(on(this.singleListRadio, 'click', lang.hitch(this, function () {
        if (this.singleListRadio.get('checked')) {
          //html.setStyle(this.groupsSection, 'display', 'none');
        }
      })));

      /* END CHANGE */
    },

    startup: function startup() {
      this.inherited(arguments);
      if (!this.map) {
        domStyle.set(this.baseMapsDiv, 'display', 'none');
        return;
      }
      if (!this.config.basemapGallery) {
        this.config.basemapGallery = {};
      }
      this.setConfig(this.config);
    },

    setConfig: function setConfig(config) {
      this.config = config;
      this.basemaps = [];
      this.mapItems = [];

      // Add custom basemaps if any
      array.forEach(config.basemapGallery.basemaps, function (basemap) {
        this.basemaps.push({
          title: basemap.title,
          thumbnailUrl: basemap.thumbnailUrl,
          layers: basemap.layers,
          spatialReference: basemap.spatialReference
        });
      }, this);

      if (config.basemapGallery.mode === CUSTOM_BASEMAP || // compatible with old version
      !('mode' in config.basemapGallery) && this.basemaps.length > 0) {
        this.customRaido.set('checked', true);
        html.removeClass(this.baseMapsDiv, 'mode-online');
        domStyle.set(this.customBasemapSection, 'display', 'block');
        this.clearBaseMapsDiv();
        this._createMapItems();
      } else {
        this.respectOnlineRaido.set('checked', true);
        html.addClass(this.baseMapsDiv, 'mode-online');
        domStyle.set(this.customBasemapSection, 'display', 'none');
        this.clearBaseMapsDiv();
        this.loadDefaultBasemaps();
      }

      /* BEGIN CHANGES: Basemap Groups Functions */

      if (config.basemapGallery.useGroups && config.basemapGallery.mode === RESPECT_ONLINE) {
        this.useGroupsRadio.set('checked', true);
        domStyle.set(this.groupsSection, 'display', 'block');
      } else {
        this.singleListRadio.set('checked', true);
        domStyle.set(this.groupsSection, 'display', 'none');
      }

      this.createTableObject(config.basemapGallery.groups);

      /* END CHANGES */
    },

    getConfig: function getConfig() {
      if (this.respectOnlineRaido.get('checked')) {
        this.config.basemapGallery.mode = RESPECT_ONLINE;
      } else if (this.customRaido.get('checked')) {
        this.config.basemapGallery.mode = CUSTOM_BASEMAP;
      }
      this.config.basemapGallery.basemaps = this.basemaps;

      /* BEGIN CHANGE: Basemap groups function */

      this.config.basemapGallery.useGroups = this.useGroupsRadio.get('checked');

      /* END CHANGE */

      return this.config;
    },

    onAddBaseMapClick: function onAddBaseMapClick() {
      this._openEdit(null);
    },

    loadDefaultBasemaps: function loadDefaultBasemaps() {
      this.loadingShelter.show();
      utils._loadPortalBaseMaps(this.appConfig.portalUrl, this.map).then(lang.hitch(this, function (basemaps) {
        if (!basemaps || basemaps.length === 0) {
          html.setStyle(this.nomapTipsSection, 'display', '');
          this.loadingShelter.hide();
          return;
        }
        html.setStyle(this.nomapTipsSection, 'display', 'none');
        array.forEach(basemaps, function (basemap) {
          this._createMapItem(basemap, BasemapItem.MODE_READONLY);
        }, this);
        this.loadingShelter.hide();
      }), lang.hitch(this, function (err) {
        console.warn(err);
        this.loadingShelter.hide();
      }));
    },

    updateBasemap: function updateBasemap(title, basemap) {
      var index = -1;
      array.some(this.basemaps, function (item, i) {
        if (item.title === title) {
          index = i;
          return true;
        }
      });
      if (index !== -1) {
        this.basemaps[index] = basemap;
        this.mapItems[index].updateItem(basemap);
      }
    },

    addNewBasemap: function addNewBasemap(basemap) {
      this._createMapItem(basemap, BasemapItem.MODE_EDIT);
      this.basemaps.push(basemap);
      html.setStyle(this.tipsSection, 'display', 'none');
    },

    _createMapItems: function _createMapItems() {
      this.loadingShelter.show();
      if (this.basemaps.length === 0) {
        html.setStyle(this.tipsSection, 'display', '');
        this.loadingShelter.hide();
        return;
      }
      html.setStyle(this.tipsSection, 'display', 'none');
      array.forEach(this.basemaps, function (basemap) {
        this._createMapItem(basemap, BasemapItem.MODE_EDIT);
      }, this);
      this.loadingShelter.hide();
    },

    _createMapItem: function _createMapItem(basemap, mode) {
      var mapItem = new BasemapItem({
        appConfig: this.appConfig,
        basemap: basemap,
        folderUrl: this.folderUrl,
        nls: this.nls,
        spatialReference: this.map.spatialReference,
        mode: mode
      });
      // if ((this.mapItems.length + 1) % 6 === 0) {
      //   html.addClass(mapItem.domNode, 'no-margin');
      // }
      html.place(mapItem.domNode, this.baseMapsDiv);
      if (mode === BasemapItem.MODE_EDIT) {
        this.own(on(mapItem, 'delete', lang.hitch(this, this._onMapItemDeleteClick)));
        this.own(on(mapItem, 'edit', lang.hitch(this, this._onMapItemEditClick)));
      }
      this.own(on(mapItem, 'selected', lang.hitch(this, this._onMapItemSelectedChange)));
      this.mapItems.push(mapItem);
    },

    clearBaseMapsDiv: function clearBaseMapsDiv() {
      array.forEach(this.mapItems, function (mapItem) {
        html.destroy(mapItem.domNode);
      }, this);
      this.mapItems = [];
    },

    _openEdit: function _openEdit(mapItem) {
      var basemap = mapItem ? mapItem.basemap : null;
      /*jshint unused: false*/
      var edit = new Edit({
        nls: this.nls,
        folderUrl: this.folderUrl,
        appUrl: this.appUrl,
        //baseMapSRID: this.spatialRef
        basemap: basemap,
        basemaps: this.basemaps,
        map: this.map,
        token: utils.getToken(this.appConfig.portalUrl)
      });
      //this.edit.setConfig(basemap || {});
      this.popup = new Popup({
        titleLabel: basemap && basemap.title || this.nls.createBasemap,
        autoHeight: true,
        content: edit,
        container: 'main-page',
        width: 800,
        height: 600,
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          disable: true,
          //onClick: lang.hitch(this, '_onEditOk')
          onClick: lang.hitch(edit, edit._onEditOk, this)
        }, {
          label: this.nls.cancel,
          classNames: ['jimu-btn-vacation'],
          key: keys.ESCAPE,
          onClose: lang.hitch(edit, edit._onEditClose, this)
        }]
      });
      edit.startup();
    },

    _onMapItemEditClick: function _onMapItemEditClick(mapItem) {
      this._openEdit(mapItem);
    },

    _onMapItemDeleteClick: function _onMapItemDeleteClick(mapItem) {
      this.basemaps = array.filter(this.basemaps, function (basemap) {
        return mapItem.basemap.title !== basemap.title;
      }, this);
      this.mapItems = array.filter(this.mapItems, function (item) {
        return mapItem !== item;
      }, this);
      html.destroy(mapItem.domNode);
      // this._onMapItemSelectedChange();
      if (this.mapItems.length === 0) {
        html.setStyle(this.tipsSection, 'display', '');
      }
    },

    _onMapItemSelectedChange: function _onMapItemSelectedChange() {
      var selected = array.some(this.mapItems, function (item) {
        return item.isSelected();
      }, this);
      if (selected) {
        html.setStyle(this.deleteBasemapBtn, 'display', 'block');
      } else {
        html.setStyle(this.deleteBasemapBtn, 'display', 'none');
      }
    },

    _deleteSelectedItem: function _deleteSelectedItem() {
      var toDeleteMapItems = array.filter(this.mapItems, function (item) {
        return item.isSelected();
      }, this);
      this.mapItems = array.filter(this.mapItems, function (item) {
        return !item.isSelected();
      }, this);
      this.basemaps = array.map(this.mapItems, function (item) {
        return item.basemap;
      }, this);
      array.forEach(toDeleteMapItems, function (item) {
        html.destroy(item.domNode);
      }, this);
      this._onMapItemSelectedChange();
    },

    onDeleteBaseMapBtnClick: function onDeleteBaseMapBtnClick() {
      var popup = new Popup({
        width: 400,
        height: 200,
        titleLabel: this.nls.warningTitle,
        content: this.nls.confirmDelete,
        container: 'main-page',
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          classNames: ['map-selector-btn-ok'],
          onClick: lang.hitch(this, function () {
            popup.close();
            this._deleteSelectedItem();
          })
        }, {
          label: this.nls.cancel,
          key: keys.ESCAPE,
          classNames: ['map-selector-btn-cancel', 'jimu-btn-vacation'],
          onClick: lang.hitch(this, function () {
            popup.close();
          })
        }]
      });
    },

    onChooseFromOnlineClick: function onChooseFromOnlineClick() {
      var itemType = window.appInfo.appType === "HTML3D" ? "Web Scene" : "Web Map";
      var groupSelector = new GroupSelector({
        appConfig: this.appConfig,
        type: itemType,
        multiple: true,
        folderUrl: this.folderUrl,
        nls: this.nls,
        map: this.map,
        spatialReference: this.map.spatialReference
      });

      var popup = new Popup({
        width: 700,
        height: 500,
        titleLabel: this.nls.importTitle,
        content: groupSelector,
        container: 'main-page',
        onClose: lang.hitch(this, function () {
          try {
            if (groupSelector && groupSelector.domNode) {
              groupSelector.destroy();
            }
          } catch (e) {
            console.error(e);
          }
          groupSelector = null;
          return true;
        }),
        buttons: [{
          label: this.nls.ok,
          key: keys.ENTER,
          disable: true,
          classNames: ['map-selector-btn-ok'],
          onClick: lang.hitch(this, function () {
            var result = groupSelector.getSelectedBasemaps();
            //popup.close();
            this._chooseMapFromWeb(result, popup);
          })
        }, {
          label: this.nls.cancel,
          key: keys.ESCAPE,
          classNames: ['map-selector-btn-cancel', 'jimu-btn-vacation'],
          onClick: lang.hitch(this, function () {
            popup.close();
          })
        }]
      });
    },

    _chooseMapFromWeb: function _chooseMapFromWeb(basemaps, mapSelectorPopup) {
      mapSelectorPopup.close();

      if (basemaps && basemaps.length > 0) {
        html.setStyle(this.tipsSection, 'display', 'none');
      }
      array.forEach(basemaps, function (basemap) {
        // Rename title if necessary
        var titles = array.map(this.basemaps, function (basemap) {
          return basemap.title;
        });
        basemap.title = utils.getUniqueTitle(basemap.title, titles);
        this._createMapItem(basemap, BasemapItem.MODE_EDIT);
        this.basemaps.push(basemap);
      }, this);
    },

    /* BEGIN CHANGES: Custom Group Functions */

    createTableObject: function createTableObject(pParam) {
      var fields = null;
      fields = [{
        name: "id",
        title: this.nls.tables.group,
        "class": "label",
        type: "text",
        width: "100px",
        editable: true
      }, {
        name: "label",
        title: this.nls.tables.label,
        "class": "label",
        type: "text",
        width: "150px",
        editable: true
      }, {
        name: "tag",
        title: this.nls.tables.tag,
        "class": "label",
        type: "text",
        width: "100px",
        editable: true
      }, {
        name: "includedBasemaps",
        title: this.nls.tables.tag,
        "class": "label",
        type: "empty",
        width: "200px"
      }, {
        name: "actions",
        title: this.nls.tables.action,
        type: "actions",
        actions: ["edit", "delete"],
        width: "50px"
      }, {
        name: 'dataTypeCol',
        type: 'empty',
        hidden: true,
        width: 0
      }];

      var args = {
        fields: fields,
        'class': 'layer-tables'
      };
      var groupTable = new SimpleTable(args);
      groupTable.placeAt(dom.byId('grpDiv'));
      groupTable.startup();

      this.own(on(groupTable, 'actions-edit', lang.hitch(this, function (row) {
        //this.
      })));

      if (typeof pParam !== 'undefined' && pParam !== null) {
        array.forEach(pParam, lang.hitch(this, function (group) {
          this.addGroupRow(groupTable, group);
        }));
      } else {
        this.addGroupRow(groupTable, pParam);
      }

      //this.createLayerSelection();
    },

    addGroupRow: function addGroupRow(pBlock, pParam) {
      var result = pBlock.addRow(pParam);
      if (result.success && result.tr) {
        var tr = result.tr;

        /*
        this.createGroupSelection(tr, pParam, numPart);
          var valueRadio = tr.cells[2].childNodes[0];
        var radioState = valueRadio.checked;
        this.own(on(valueRadio, "click", lang.hitch(this, function() {
          if(radioState) {
            valueRadio.checked = false;
            radioState = false;
          } else {
            valueRadio.checked = true;
            radioState = true;
          }
        })));
        */
      }
    }

    /* END CHANGES */

  });
});
