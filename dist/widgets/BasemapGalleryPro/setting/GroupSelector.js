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
///////////////////////////////////////////////////////////////////////////

define(['dojo/_base/declare', 'dijit/_WidgetBase', 'dijit/_TemplatedMixin', 'dijit/_WidgetsInTemplateMixin', 'dojo/text!./GroupSelector.html', 'dojo/_base/lang', 'dojo/_base/array', 'dojo/_base/html', 'dojo/query', 'dojo/on', 'jimu/utils', 'jimu/portalUrlUtils', 'jimu/dijit/Search', 'jimu/portalUtils', './MapTable', '../utils', 'dijit/form/Select'], function (declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, lang, array, html, query, on, jimuUtils, portalUrlUtils, Search, portalUtils, MapTable, utils) {
  /* jshint unused: false */
  return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: template,
    baseClass: "basemap-group-selector",
    nls: null,
    type: '', //Web Map or Web Scene
    multiple: false,
    appConfig: null,
    map: null,
    spatialReference: null,

    _user: null,
    _group: null,
    _webMapQueryString: '',

    //group
    _allGroupQuery: null,

    portal: null,

    //public methods:
    //getSelectedMapItem

    postCreate: function postCreate() {
      this.inherited(arguments);
      this._webMapQueryString = ' ' + jimuUtils.getItemQueryStringByTypes([this.type]) + ' ';
      this.portal = portalUtils.getPortal(this._getPortalUrl());
      this._allGroupQuery = this._getQuery();

      this.groupMapTable = new MapTable({
        appConfig: this.appConfig,
        type: this.type,
        multiple: true,
        folderUrl: this.folderUrl,
        portalUrl: this._getPortalUrl(),
        nls: this.nls,
        map: this.map,
        spatialReference: this.spatialReference
      });
      this.groupMapTable.placeAt(this.groupMapTableDiv);
      this.own(on(this.groupMapTable, 'selectionChange', lang.hitch(this, this._checkBtnStatus)));

      this.portal.getUser().then(lang.hitch(this, function (user) {
        this._searchGroups(user);
      }));
    },

    postMixInProperties: function postMixInProperties() {
      this.nls = lang.mixin(this.nls, window.jimuNls.common, window.jimuNls.itemSelector);
    },

    _getQuery: function _getQuery(other) {
      var other2 = other || {};
      var query = lang.mixin({
        start: 1,
        num: 100,
        f: 'json'
      }, other2);
      return query;
    },

    _getPortalUrl: function _getPortalUrl() {
      return portalUrlUtils.getStandardPortalUrl(window.portalUrl);
    },

    _onGroupSearch: function _onGroupSearch() {
      var sortFieldAndSortOrder = {
        sortField: 'title',
        sortOrder: 'asc'
      };

      this._allGroupQuery.start = 1;
      lang.mixin(this._allGroupQuery, sortFieldAndSortOrder);
      this.groupMapTable.search(this._allGroupQuery);
    },

    _searchGroups: function _searchGroups(user) {
      this._resetGroupsSection();
      var groups = user.getGroups();
      var esriDefaultGroup = 'title:"ArcGIS Online Basemaps" AND owner:esri_en';
      var portalUrl = this._getPortalUrl();
      var esriId, groupId;

      utils.getBasemapGalleryGroup(portalUrl, esriDefaultGroup).then(lang.hitch(this, function (esriGroup) {
        esriId = esriGroup.id;
        this._createEsriDefaultOption(esriGroup.id);
        return esriId;
      })).then(lang.hitch(this, function () {
        return utils.getBasemapGalleryGroup(portalUrl, this.portal.basemapGalleryGroupQuery);
      })).then(lang.hitch(this, function (group) {
        groupId = group.id;
        html.create('option', {
          value: group.id,
          innerHTML: this.nls.defaultOrgGroup
        }, this.groupsSelect);
      })).then(lang.hitch(this, function () {
        this._createUserGroupsOption(groups, [esriId, groupId]);
        this._onGroupsSelectChange();
      }), lang.hitch(this, function () {
        this._createUserGroupsOption(groups, [esriId, groupId]);
        this._onGroupsSelectChange();
      }));
    },

    _createEsriDefaultOption: function _createEsriDefaultOption(esriDefaultGroupId) {
      // esri default
      html.create('option', {
        value: esriDefaultGroupId,
        innerHTML: this.nls.defaultGroup
      }, this.groupsSelect);
    },

    _createUserGroupsOption: function _createUserGroupsOption(groups, excludes) {
      if (groups.length > 0) {
        for (var i = 0; i < groups.length; i++) {
          var group = groups[i];
          if (excludes.indexOf(group.id) < 0) {
            html.create('option', {
              value: group.id,
              innerHTML: group.title
            }, this.groupsSelect);
          }
        }
      }
    },

    _resetGroupsSection: function _resetGroupsSection() {
      html.empty(this.groupsSelect);
      this.groupMapTable.clear();
    },

    _onGroupsSelectChange: function _onGroupsSelectChange() {
      var groupId = this.groupsSelect.value,
          groupQuery;
      if (groupId.indexOf(':') >= 0) {
        groupQuery = groupId;
      } else {
        groupQuery = 'group:' + groupId;
      }
      this.groupMapTable.clear();
      if (groupId !== 'nodata') {
        var portalUrl = this._getPortalUrl();
        var q = groupQuery + ' AND ' + this._webMapQueryString;
        this._allGroupQuery = this._getQuery({ q: q });
        this._onGroupSearch();
      }
    },

    getSelectedBasemaps: function getSelectedBasemaps() {
      return array.map(this.groupMapTable.getSelectedMapItems(), function (basemapItem) {
        return basemapItem.basemap;
      });
    },

    _checkBtnStatus: function _checkBtnStatus() {
      if (this.getSelectedBasemaps().length > 0) {
        this.popup.enableButton(0);
      } else {
        this.popup.disableButton(0);
      }
    }
  });
});
