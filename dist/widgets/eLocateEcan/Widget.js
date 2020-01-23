///////////////////////////////////////////////////////////////////////////
// Robert Scheitlin WAB eLocate Widget
///////////////////////////////////////////////////////////////////////////
/*global define, console, setTimeout, clearTimeout*/
define(['dojo/_base/declare', 'dijit/_WidgetsInTemplateMixin', 'jimu/BaseWidget', 'jimu/dijit/TabContainer', './List', './CountryCodes', 'jimu/dijit/Message', 'esri/layers/GraphicsLayer', 'esri/tasks/GeometryService', 'esri/config', 'esri/graphic', 'esri/graphicsUtils', 'esri/geometry/Point', 'esri/symbols/SimpleMarkerSymbol', 'esri/symbols/PictureMarkerSymbol', 'esri/symbols/SimpleLineSymbol', 'esri/Color', 'esri/geometry/Extent', 'esri/geometry/Geometry', 'esri/symbols/SimpleFillSymbol', 'esri/renderers/SimpleRenderer', 'esri/dijit/PopupTemplate', 'esri/dijit/LocateButton', 'esri/request', 'esri/tasks/locator', 'esri/toolbars/draw', 'esri/symbols/jsonUtils', 'esri/tasks/AddressCandidate', 'dojo/i18n!esri/nls/jsapi', 'dojo/Deferred', 'dijit/ProgressBar', 'dijit/Tooltip', 'dojo/_base/lang', 'dojo/dom', 'dojo/dom-style', 'dojo/dom-attr', 'dojo/on', 'dojo/aspect', 'dojo/_base/html', 'dojo/dom-class', 'dojo/_base/array', 'jimu/utils', 'jimu/dijit/LoadingShelter', 'dojo/io-query', 'esri/SpatialReference', 'esri/tasks/ProjectParameters', 'esri/geometry/webMercatorUtils', 'jimu/WidgetManager', 'jimu/PanelManager', 'dijit/form/Select', 'jimu/dijit/CheckBox', 'dojo/domReady!'], function (declare, _WidgetsInTemplateMixin, BaseWidget, TabContainer, List, CountryCodes, Message, GraphicsLayer, GeometryService, esriConfig, Graphic, graphicsUtils, Point, SimpleMarkerSymbol, PictureMarkerSymbol, SimpleLineSymbol, Color, Extent, Geometry, SimpleFillSymbol, SimpleRenderer, PopupTemplate, LocateButton, esriRequest, locator, Draw, jsonUtils, AddressCandidate, esriBundle, Deferred, ProgressBar, Tooltip, lang, dojoDom, domStyle, domAttr, on, aspect, html, domClass, array, utils, LoadingShelter, ioquery, SpatialReference, ProjectParameters, webMercatorUtils, WidgetManager, PanelManager) {
  return declare([BaseWidget, _WidgetsInTemplateMixin], { /*jshint unused: false*/
    baseClass: 'widget-eLocate-ecan',
    progressBar: null,
    locateButton: null,
    tabContainer: null,
    disabledTabs: null,
    list: null,
    selTab: null,
    graphicsLayer: null,
    enableGraphicClickInfo: true,
    timer2: null,
    timer: null,
    autoCloseNum: null,
    enableMoverRec: false,
    infoWinMouseOver: null,
    infoWinMouseOut: null,
    wManager: null,
    pManager: null,
    addressTab: true,
    coordTab: true,
    revTab: true,
    rsltsTab: true,
    _locatorUrl: "//geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
    _unitArr: null,
    locateResultArr: null,
    zoomScale: null,
    forceScale: null,
    drawToolBar: null,
    _defaultAddPointStr: "",
    serviceWKID: null,
    geocode: {},
    rGeoMarkerSymbol: null,
    addressMarkerSymbol: null,
    coordMarkerSymbol: null,
    isCapturingCoordsFromMap: false,

    postCreate: function postCreate() {
      this.inherited(arguments);
      this.drawLayer = new GraphicsLayer({ id: "DrawGL" });
      this.list.zoom2msg = this.nls.zoom2message;
      this.list.removeResultMsg = this.nls.removeresultmessage;
      this._initTabContainer();
      this._initProgressBar();
      this._initLocateButtons();
      this._initUnitsDD();
      this._initDraw();
      this._initLocator();
      this._initSymbols();
      this._bindEvents();

      this.wManager = WidgetManager.getInstance();
      this.pManager = PanelManager.getInstance();
      this._addThemeFixes();

      this.own(on(this.domNode, 'mousedown', lang.hitch(this, function (event) {
        event.stopPropagation();
        if (event.altKey) {
          var msgStr = this.nls.widgetverstr + ': ' + this.manifest.version;
          msgStr += '\n' + this.nls.wabversionmsg + ': ' + this.manifest.wabVersion;
          msgStr += '\n' + this.manifest.description;
          new Message({
            titleLabel: this.nls.widgetversion,
            message: msgStr
          });
        }
      })));
      this.zoomScale = this.config.zoomscale || 5000;
      this.forceScale = this.config.forcescale || false;
      this.minscore = Number(this.config.minscore) || 40;
      this.enableMoverRec = this.config.enablemouseoverrecordinfo;
      this.enableMoverGra = this.config.enablemouseovergraphicsinfo;
      this.autoCloseNum = this.config.infoautoclosemilliseconds || Number.NEGATIVE_INFINITY;
      this.cbxAddSearchExtent.setValue(this.config.limitsearchtomapextentbydefault || false);

      // Natural sort map sheets
      for (var i = 0; i < this.config.mapSheets.length; i++) {
        this.config.mapSheets[i].sheets.sort(function (a, b) {
          var ax = [],
              bx = [];

          a.sheet.replace(/(\d+)|(\D+)/g, function (_, $1, $2) {
            ax.push([$1 || Infinity, $2 || ""]);
          });
          b.sheet.replace(/(\d+)|(\D+)/g, function (_, $1, $2) {
            bx.push([$1 || Infinity, $2 || ""]);
          });

          while (ax.length && bx.length) {
            var an = ax.shift();
            var bn = bx.shift();
            var nn = an[0] - bn[0] || an[1].localeCompare(bn[1]);
            if (nn) return nn;
          }

          return ax.length - bx.length;
        });
      }
    },

    _bindEvents: function _bindEvents() {
      this.own(on(this.btnClear, 'click', lang.hitch(this, this._clear)));
      html.setStyle(this.btnClear, 'display', 'none');
      this.own(on(this.list, 'remove', lang.hitch(this, this._removeResultItem)));
      this.own(on(this.btnClear2, 'click', lang.hitch(this, this._clear)));
      html.setStyle(this.btnClear2, 'display', 'none');
      this.own(on(this.btnClear1, 'click', lang.hitch(this, this._clear)));
      html.setStyle(this.btnClear1, 'display', 'none');
      this.own(on(this.CoordInputBtns_Map, 'click', lang.hitch(this, this._toggleMapClickCapture)));
      this.own(on(this.btnCoordLocate, 'click', lang.hitch(this, this.prelocateCoords)));
      this.own(on(this.revGeocodeBtn, 'click', lang.hitch(this, this._reverseGeocodeToggle)));
      this.own(on(this.CoordHintText, "click", lang.hitch(this, this._useExampleText)));
      this.own(on(this.btnCopyToClipboard, 'click', lang.hitch(this, this._copyFullCoordsToClipboard)));
      this.own(on(this.btnCopyFullCoords, 'click', lang.hitch(this, this._copyFullCoordsToClipboard)));
      this.own(on(this.btnCopyMapSheet, 'click', lang.hitch(this, this._copyMapSheetToClipboard)));
      this.own(on(this.btnCopyXCoord, 'click', lang.hitch(this, this._copyXCoordToClipboard)));
      this.own(on(this.btnCopyYCoord, 'click', lang.hitch(this, this._copyYCoordToClipboard)));
      this.own(on(this.btnAddressLocate, 'click', lang.hitch(this, this._locateAddress)));
      this.own(on(this.AddressTextBox, 'keydown', lang.hitch(this, function (evt) {
        var keyNum = evt.keyCode !== undefined ? evt.keyCode : evt.which;
        if (keyNum === 13) {
          this._locateAddress();
        }
      })));
      this.own(on(this.map, 'click', lang.hitch(this, this._onMapClick)));
    },

    startup: function startup() {
      this.inherited(arguments);

      this.graphicsLayer = new GraphicsLayer();
      this.graphicsLayer.name = 'eLocate Results';
      this.map.addLayer(this.graphicsLayer);
      if (this.enableMoverGra) {
        this.graphicsLayer.on('mouse-over', lang.hitch(this, this.mouseOverGraphic));
      }

      aspect.before(this, 'onClose', function () {
        // Stop tracking
        if (this.locateButton && this.locateButton.tracking) {
          this.locateButton.locate(); // Toggle tracking off
        }
      });
    },

    _initSymbols: function _initSymbols() {
      var addJson = lang.clone(this.config.symbols.addresspicturemarkersymbol);
      addJson.url = this.folderUrl + addJson.url;

      var geoJson = lang.clone(this.config.symbols.geopicturemarkersymbol);
      geoJson.url = this.folderUrl + geoJson.url;

      var coordJson = lang.clone(this.config.symbols.coordpicturemarkersymbol);
      coordJson.url = this.folderUrl + coordJson.url;

      this.rGeoMarkerSymbol = jsonUtils.fromJson(geoJson);
      this.coordMarkerSymbol = jsonUtils.fromJson(coordJson);
      this.addressMarkerSymbol = jsonUtils.fromJson(addJson);
    },

    _initLocator: function _initLocator() {
      var locatorUrl = this.config.locator.url || this._locatorUrl;
      this.geocode.url = locatorUrl;
      var rGeocode = this._getLocatorInfo(this.geocode);
      if (rGeocode) {
        if (rGeocode.version < 10.1) {
          html.setStyle(this.cbxAddSearchExtent, 'display', 'none');
        }
        this.locator = new locator(locatorUrl);
        this.locator.outSpatialReference = this.map.spatialReference;
      } else {
        new Message({
          titleLabel: this.nls.locatorissue,
          message: this.nls.locatorissuemessage
        });
        html.replaceClass(this.tabNode1, 'eLocate-tab-node-hidden', 'eLocate-tab-node');
      }
    },

    _getLocatorInfo: function _getLocatorInfo(geocode) {
      var def = new Deferred();
      esriRequest({
        url: geocode.url,
        content: {
          f: "json"
        },
        handleAs: "json",
        callbackParamName: "callback"
      }).then(lang.hitch(this, function (response) {
        if (response.singleLineAddressField && response.singleLineAddressField.name) {
          //            console.info(response);
          geocode.singleLineFieldName = response.singleLineAddressField.name;
          geocode.version = response.currentVersion;
          this.serviceWKID = response.spatialReference.wkid;
          def.resolve(geocode);
        } else {
          console.warn(geocode.url + "has no singleLineFieldName");
          def.resolve(null);
        }
      }), lang.hitch(this, function (err) {
        console.error(err);
        def.resolve(null);
      }));

      return def;
    },

    _initDraw: function _initDraw() {
      this._defaultAddPointStr = esriBundle.toolbars.draw.addPoint;
      this.drawToolBar = new Draw(this.map);
      this.map.addLayer(this.drawLayer);
      this.pointSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_X, 12, null, new Color(255, 0, 0, 255));
      this.drawToolBar.setMarkerSymbol(this.pointSymbol);
      this.own(on(this.drawToolBar, 'draw-end', lang.hitch(this, this._onDrawEnd)));
    },

    _onDrawEnd: function _onDrawEnd(event) {
      var g = new Graphic(event.geometry, this.pointSymbol, null, null);
      this.drawLayer.clear();
      this.drawLayer.add(g);
      this.locator.locationToAddress(event.geometry, 30, lang.hitch(this, this.rlocateResult), lang.hitch(this, this.locateError));
      if (!this.config.keepinspectoractive) {
        var node = this.revGeocodeBtn;
        domClass.remove(node, "selected");
        this.drawToolBar.deactivate();
        this.drawActive = false;
        esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;
        this.enableWebMapPopup();
      }
    },

    locateError: function locateError(info) {
      console.error(info);
      if (!this.config.keepinspectoractive) {
        this._reverseGeocodeToggle();
      }
      new Message({
        titleLabel: this.nls.reversegeocodefailtitle,
        message: this.nls.reversegeocodefailmsg
      });
    },

    rlocateResult: function rlocateResult(event) {
      this.disableTimer();
      this._hideInfoWindow();
      this.list.clear();
      this.locateResultArr = this.createAddressInspectorResult(event);
      this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.locateResultArr.length;
      if (this.locateResultArr.length > 0) {
        this.list.add(this.locateResultArr[0]);
        this.tabContainer.selectTab(this.nls.resultslabel);
        this.showLocation(this.locateResultArr[0]);
      }
    },

    createAddressInspectorResult: function createAddressInspectorResult(addrCandidate) {
      var result = [];

      var sAdd = this.standardizeAddress(addrCandidate);
      var locateResult = {};
      locateResult.sym = this.rGeoMarkerSymbol;
      locateResult.title = addrCandidate.address.Address ? String(addrCandidate.address.Address) : addrCandidate.address.Street ? String(addrCandidate.address.Street) : this.manifest.name;
      locateResult.content = locateResult.rsltcontent = "<em>" + this.nls.address + "</em>: " + sAdd + "<br><em>" + this.nls.coordinates + "</em>: " + addrCandidate.location.x.toFixed(2) + ", " + addrCandidate.location.y.toFixed(2);
      locateResult.point = addrCandidate.location;
      locateResult.alt = false;
      locateResult.id = 'id_1';
      var projParams = new ProjectParameters();
      if (!locateResult.point.spatialReference && !isNaN(this.serviceWKID)) {
        // AGS 9.X returns locations w/o a SR and doesn't support outSR
        locateResult.point.setSpatialReference(new SpatialReference(this.serviceWKID));
        if (webMercatorUtils.canProject(locateResult.point, this.map)) {
          locateResult.point = webMercatorUtils.project(locateResult.point, this.map);
        } else {
          projParams.geometries = [locateResult.point];
          projParams.outSR = this.map.spatialReference;
          esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandler, addrCandidate), lang.hitch(this, this.geometryService_faultHandler));
        }
      } else if (locateResult.point.spatialReference) {
        if (webMercatorUtils.canProject(locateResult.point, this.map)) {
          locateResult.point = webMercatorUtils.project(locateResult.point, this.map);
        } else {
          projParams.geometries = [locateResult.point];
          projParams.outSR = this.map.spatialReference;
          esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandler, addrCandidate), lang.hitch(this, this.geometryService_faultHandler));
        }
      }

      result.push(locateResult);
      return result;
    },

    standardizeAddress: function standardizeAddress(result) {
      var retStr = "";
      if (result.address.Address) {
        retStr += result.address.Address + "\n";
      } else if (result.address.Street) {
        retStr += result.address.Street + "\n";
      }
      if (result.address.City) {
        retStr += result.address.City + ", ";
      }
      if (result.address.State) {
        retStr += result.address.State + " ";
      } else if (result.address.Region) {
        retStr += result.address.Region + " ";
      }
      if (result.address.Postal) {
        retStr += result.address.Postal;
      } else if (result.address.Zip4) {
        retStr += result.address.Zip4;
      } else if (result.address.Zip) {
        retStr += result.address.Zip;
      }
      if (result.address.CountryCode && result.address.CountryCode != "USA") {
        retStr += " " + this.toProperCase(CountryCodes[result.address.CountryCode]) || result.address.CountryCode;
      }
      return retStr;
    },

    toProperCase: function toProperCase(str) {
      return str.replace(/\w\S*/g, function (str) {
        return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
      });
    },

    _initLocateButtons: function _initLocateButtons() {
      this.locateButton = new LocateButton({
        map: this.map,
        theme: 'my-location-widget jimu-widget',
        useTracking: true,
        clearOnTrackingStop: true
      }, this.CoordInputBtns_LocateMe);

      this.locateButton.startup();

      this.own(on(this.locateButton, 'locate', lang.hitch(this, this._locateUpdate)));
    },

    _getCoordPartFormattedString: function _getCoordPartFormattedString(coordPart, part) {
      var selUnit = this._unitArr[this.unitdd.get('value')];

      if (selUnit.wkid == 4326 && (selUnit.wgs84option == 'dm' || selUnit.wgs84option == 'ddm' || selUnit.wgs84option == 'dms')) {
        var value = parseFloat(coordPart);
        var format = selUnit.wgs84option;
        if (format == 'ddm') format = 'dm';
        if (part == 'x') {
          return this._getWgs84LonCoordFormattedString(value, format, selUnit.precision);
        } else if (part == 'y') {
          return this._getWgs84LatCoordFormattedString(value, format, selUnit.precision);
        }
      } else {
        return parseFloat(parseFloat(coordPart).toFixed(selUnit.precision)).toString();
      }
    },

    _getWgs84LatCoordFormattedString: function _getWgs84LatCoordFormattedString(deg, format, dp) {
      var lat = this._getWgs84CoordFormattedString(deg, format, dp);
      return lat == '' ? '' : lat.slice(1) + (deg < 0 ? 'S' : 'N'); // knock off initial '0' for lat!
    },

    _getWgs84LonCoordFormattedString: function _getWgs84LonCoordFormattedString(deg, format, dp) {
      var lon = this._getWgs84CoordFormattedString(deg, format, dp);
      return lon == '' ? '' : lon + (deg < 0 ? 'W' : 'E');
    },

    _getWgs84CoordFormattedString: function _getWgs84CoordFormattedString(deg, format, dp) {
      if (isNaN(deg)) return 'NaN'; // give up here if we can't make a number from deg

      // default values
      if (typeof format == 'undefined') format = 'dms';
      if (typeof dp == 'undefined') {
        switch (format) {
          case 'dm':
            dp = 2;break;
          case 'dms':
            dp = 0;break;
          default:
            format = 'dms';dp = 0; // be forgiving on invalid format
        }
      }

      deg = Math.abs(deg); // (unsigned result ready for appending compass dir'n)

      switch (format) {
        case 'dm':
          var min = (deg * 60).toFixed(dp); // convert degrees to minutes & round
          var d = Math.floor(min / 60); // get component deg/min
          var m = (min % 60).toFixed(dp); // pad with trailing zeros
          if (d < 100) d = '0' + d; // pad with leading zeros
          if (d < 10) d = '0' + d;
          if (m < 10) m = '0' + m;
          dms = d + '\xB0' + m + '\u2032'; // add º, ' symbols
          //dms = d + '\u00B0 ' + m + '\u2032 ';  // add º, ' symbols // NOTE: Added spaces for formatting
          break;
        case 'dms':
          var sec = (deg * 3600).toFixed(dp); // convert degrees to seconds & round
          var d = Math.floor(sec / 3600); // get component deg/min/sec
          var m = Math.floor(sec / 60) % 60;
          var s = (sec % 60).toFixed(dp); // pad with trailing zeros
          if (d < 100) d = '0' + d; // pad with leading zeros
          if (d < 10) d = '0' + d;
          if (m < 10) m = '0' + m;
          if (s < 10) s = '0' + s;
          dms = d + '\xB0' + m + '\u2032' + s + '\u2033'; // add º, ', " symbols
          //dms = d + '\u00B0 ' + m + '\u2032 ' + s + '\u2033 ';  // add º, ', " symbols // NOTE: Added spaces for formatting
          break;
      }

      return dms;
    },

    _locateUpdate: function _locateUpdate(event) {
      if (event.error == null && event.position != null && event.position.coords != null) {
        this._useWgs84Coords(event.position.coords);
      }
    },

    _useWgs84Coords: function _useWgs84Coords(coords) {
      var selUnit = this._unitArr[this.unitdd.get('value')];

      if (selUnit.wkid == 4326) {
        this._getCoordPartFormattedString(coords.longitude);
        this.xCoordTextBox.set('value', this._getCoordPartFormattedString(coords.longitude, 'x'));
        this.yCoordTextBox.set('value', this._getCoordPartFormattedString(coords.latitude, 'y'));
      } else {
        var point = new Point(coords.longitude, coords.latitude, new SpatialReference(4326));
        var projParams = new ProjectParameters();
        projParams.geometries = [point];
        projParams.outSR = new SpatialReference(parseInt(selUnit.wkid));
        esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandlerFromMap), lang.hitch(this, this.geometryService_faultHandler));
      }
    },

    _usePointCoords: function _usePointCoords(point) {
      var selUnit = this._unitArr[this.unitdd.get('value')];

      if (selUnit.wkid == point.spatialReference.wkid) {
        if (selUnit.mapref) {
          this._displayAsMapRef(point);
        } else {
          this.xCoordTextBox.set('value', this._getCoordPartFormattedString(point.x, 'x'));
          this.yCoordTextBox.set('value', this._getCoordPartFormattedString(point.y, 'y'));
        }
      } else {
        var projParams = new ProjectParameters();
        projParams.geometries = [point];
        projParams.outSR = new SpatialReference(parseInt(selUnit.wkid));
        esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandlerFromMap), lang.hitch(this, this.geometryService_faultHandler));
      }
    },

    _displayAsMapRef: function _displayAsMapRef(point) {
      var selUnit = this._unitArr[this.unitdd.get('value')];

      var lenWkids = this.config.mapSheets.length;
      for (var i = 0; i < lenWkids; i++) {
        if (this.config.mapSheets[i].wkid == selUnit.wkid) {
          var lenSheets = this.config.mapSheets[i].sheets.length;
          for (var j = 0; j < lenSheets; j++) {
            if (point.x >= this.config.mapSheets[i].sheets[j].xmin && point.x <= this.config.mapSheets[i].sheets[j].xmax && point.y >= this.config.mapSheets[i].sheets[j].ymin && point.y <= this.config.mapSheets[i].sheets[j].ymax) {
              this.mapSheetDD.set('value', this.config.mapSheets[i].sheets[j].sheet);
              this.xCoordTextBox.set('value', point.x.toString().substring(2, selUnit.precision + 2));
              this.yCoordTextBox.set('value', point.y.toString().substring(2, selUnit.precision + 2));

              break;
            }
          }
          break;
        }
      }
    },

    projectCompleteHandlerFromMap: function projectCompleteHandlerFromMap(results, locateResult) {
      var selUnit = this._unitArr[this.unitdd.get('value')];
      if (selUnit.mapref) {
        this._displayAsMapRef(results[0]);
      } else {
        this.xCoordTextBox.set('value', this._getCoordPartFormattedString(results[0].x, 'x'));
        this.yCoordTextBox.set('value', this._getCoordPartFormattedString(results[0].y, 'y'));
      }
    },

    _initUnitsDD: function _initUnitsDD() {
      this._unitArr = [];
      var options = [];
      var len = this.config.pointunits.pointunit.length;
      for (var i = 0; i < len; i++) {
        this._unitArr.push(lang.clone(this.config.pointunits.pointunit[i]));
        var option = {
          value: i,
          label: this.config.pointunits.pointunit[i].name
        };
        options.push(option);
        if (i === 0) {
          options[i].selected = true;
          this.xCoordLbl.innerHTML = this.config.pointunits.pointunit[i].xlabel;
          this.yCoordLbl.innerHTML = this.config.pointunits.pointunit[i].ylabel;
          this.CoordHintLbl.innerHTML = this.nls.example;
          this.CoordHintText.innerHTML = this.config.pointunits.pointunit[i].example;
        }
      }
      this.unitdd.addOption(options);
      this.own(on(this.unitdd, "change", lang.hitch(this, this._unitDDChanged)));
    },

    _unitDDChanged: function _unitDDChanged(newValue) {
      this.xCoordLbl.innerHTML = this._unitArr[newValue].xlabel;
      this.yCoordLbl.innerHTML = this._unitArr[newValue].ylabel;
      this.CoordHintText.innerHTML = this._unitArr[newValue].example;
      this.mapSheetDD.set('value', '');
      this.xCoordTextBox.set('value', '');
      this.yCoordTextBox.set('value', '');
      if (this._unitArr[newValue].mapref) {
        this._refreshMapSheetDD(this._unitArr[newValue].wkid);
        domStyle.set(this.mapSheetDiv, 'display', '');
      } else {
        domStyle.set(this.mapSheetDiv, 'display', 'none');
      }
    },

    _refreshMapSheetDD: function _refreshMapSheetDD(wkid) {
      var options = [];
      var lenWkids = this.config.mapSheets.length;
      for (var i = 0; i < lenWkids; i++) {
        if (this.config.mapSheets[i].wkid == wkid) {
          options.push({
            value: null,
            label: ''
          });
          var lenSheets = this.config.mapSheets[i].sheets.length;
          for (var j = 0; j < lenSheets; j++) {
            if (j == 0 || this.config.mapSheets[i].sheets[j].sheet != this.config.mapSheets[i].sheets[j - 1].sheet) {
              // Avoid duplicate values
              var option = {
                value: this.config.mapSheets[i].sheets[j].sheet,
                label: this.config.mapSheets[i].sheets[j].sheet
              };
              options.push(option);
            }
          }
          break;
        }
      }
      this.mapSheetDD.removeOption(this.mapSheetDD.getOptions());
      this.mapSheetDD.addOption(options);
    },

    isSelTabVisible: function isSelTabVisible() {
      switch (this.selTab) {
        case this.nls.addresslabel:
          return this.addressTab;
        case this.nls.coordslabel:
          return this.coordTab;
        case this.nls.addressinsplabel:
          return this.revTab;
        case this.nls.resultslabel:
          return this.rsltsTab;
      }
    },

    _reverseGeocodeToggle: function _reverseGeocodeToggle() {
      var node = this.revGeocodeBtn;
      if (domClass.contains(node, 'selected')) {
        domClass.remove(node, "selected");
        this.drawToolBar.deactivate();
        this.drawActive = false;
        esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;
        this.enableWebMapPopup();
      } else {
        domClass.add(node, "selected");
        this.disableWebMapPopup();
        esriBundle.toolbars.draw.addPoint = this.nls.drawpointtooltip;
        this.drawToolBar.activate(Draw.POINT);
        this.drawActive = true;
      }
    },

    disableWebMapPopup: function disableWebMapPopup() {
      if (this.map) {
        this.map.setInfoWindowOnClick(false);
      }
    },

    enableWebMapPopup: function enableWebMapPopup() {
      if (this.map) {
        this.map.setInfoWindowOnClick(true);
      }
    },

    _initTabContainer: function _initTabContainer() {
      if (this.config.hasOwnProperty('disabledtabs')) {
        this.disabledTabs = this.config.disabledtabs;
      } else {
        this.disabledTabs = [];
      }
      var initView = this.config.initialView || "address";
      array.map(this.disabledTabs, lang.hitch(this, function (dTab) {
        if (dTab === 'address') {
          this.addressTab = false;
        }
        if (dTab === 'coordinate') {
          this.coordTab = false;
        }
        if (dTab === 'reverse') {
          this.revTab = false;
        }
        if (dTab === 'result') {
          this.rsltsTab = false;
        }
      }));
      if (initView === "address" && this.addressTab) {
        this.selTab = this.nls.addresslabel;
      } else if (initView === "coordinate" && this.coordTab) {
        this.selTab = this.nls.coordslabel;
      } else if (initView === "reverse" && this.revTab) {
        this.selTab = this.nls.addressinsplabel;
      } else {
        this.selTab = this.nls.addresslabel;
      }
      var tabs = [];
      if (this.addressTab) {
        tabs.push({
          title: this.nls.addresslabel,
          content: this.tabNode1
        });
        html.replaceClass(this.tabNode1, 'eLocate-tab-node', 'eLocate-tab-node-hidden');
      }
      if (this.coordTab) {
        tabs.push({
          title: this.nls.coordslabel,
          content: this.tabNode2
        });
        html.replaceClass(this.tabNode2, 'eLocate-tab-node', 'eLocate-tab-node-hidden');
      }
      if (this.revTab) {
        tabs.push({
          title: this.nls.addressinsplabel,
          content: this.tabNode3
        });
        html.replaceClass(this.tabNode3, 'eLocate-tab-node', 'eLocate-tab-node-hidden');
      }
      if (this.rsltsTab) {
        tabs.push({
          title: this.nls.resultslabel,
          content: this.tabNode4
        });
        html.replaceClass(this.tabNode4, 'eLocate-tab-node', 'eLocate-tab-node-hidden');
      }

      this.tabContainer = new TabContainer({
        tabs: tabs,
        selected: this.selTab
      }, this.tabeLocate);

      this.tabContainer.startup();
      this.own(on(this.tabContainer, 'tabChanged', lang.hitch(this, function (title) {
        if (title !== this.nls.resultslabel) {
          this.selTab = title;
          if (this.drawActive && this.selTab !== this.nls.addressinsplabel) {
            var node = this.revGeocodeBtn;
            domClass.remove(node, "selected");
            this.drawToolBar.deactivate();
            this.drawActive = false;
            esriBundle.toolbars.draw.addPoint = this._defaultAddPointStr;
            this.enableWebMapPopup();
          }
        }
      })));
      utils.setVerticalCenter(this.tabContainer.domNode);
    },

    _locateAddress: function _locateAddress() {
      this._hideInfoWindow();
      this.graphicsLayer.clear();
      this.list.clear();
      if (this.locateResultArr) {
        this.locateResultArr = [];
      }
      this.tabContainer.selectTab(this.nls.resultslabel);
      html.setStyle(this.progressBar.domNode, 'display', 'block');
      html.setStyle(this.divResult, 'display', 'none');
      var params = {};
      params.address = {};
      if (this.config.locator.countryCode) {
        params.countryCode = this.config.locator.countryCode;
      }
      params.address[this.geocode.singleLineFieldName] = this.AddressTextBox.get('value');
      console.info(params);
      if (this.cbxAddSearchExtent.getValue()) {
        params.searchExtent = this.map.extent;
      }
      this.locator.addressToLocations(params, lang.hitch(this, this.addresslocateResult), lang.hitch(this, this.locateError));
    },

    addresslocateResult: function addresslocateResult(addresses) {
      if (addresses.length > 0) {
        this.locateResultArr = this.createLocateResults(addresses);
        this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.locateResultArr.length;
        if (this.locateResultArr.length > 0) {
          this.showLocation(this.locateResultArr[0]);
        }
        html.setStyle(this.progressBar.domNode, 'display', 'none');
        html.setStyle(this.divResult, 'display', 'block');
      } else {
        html.setStyle(this.progressBar.domNode, 'display', 'none');
        html.setStyle(this.divResult, 'display', 'block');
        this.divResultMessage.textContent = this.nls.noresultsfoundlabel;
      }
    },

    createLocateResults: function createLocateResults(addresses) {
      var result = [];
      array.forEach(addresses, lang.hitch(this, function (addrCandidate, i) {
        if (addrCandidate.score >= this.minscore) {
          var locateResult = {};
          locateResult.sym = this.addressMarkerSymbol;
          locateResult.title = addrCandidate.address ? String(addrCandidate.address) : addrCandidate.street ? String(addrCandidate.street) : this.manifest.name;
          locateResult.content = locateResult.rsltcontent = "<em>" + this.nls.score + "</em>: " + (addrCandidate.score % 1 === 0 ? addrCandidate.score : addrCandidate.score.toFixed(1));
          locateResult.point = addrCandidate.location;
          locateResult.alt = i % 2 === 0;
          locateResult.id = 'id_' + i;
          var projParams = new ProjectParameters();
          if (!locateResult.point.spatialReference && !isNaN(this.serviceWKID)) {
            // AGS 9.X returns locations w/o a SR and doesn't support outSR
            locateResult.point.setSpatialReference(new SpatialReference(this.serviceWKID));
            if (webMercatorUtils.canProject(locateResult.point, this.map)) {
              locateResult.point = webMercatorUtils.project(locateResult.point, this.map);
            } else {
              projParams.geometries = [locateResult.point];
              projParams.outSR = this.map.spatialReference;
              esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandler, addrCandidate), lang.hitch(this, this.geometryService_faultHandler));
            }
          } else if (locateResult.point.spatialReference) {
            if (webMercatorUtils.canProject(locateResult.point, this.map)) {
              locateResult.point = webMercatorUtils.project(locateResult.point, this.map);
            } else {
              projParams.geometries = [locateResult.point];
              projParams.outSR = this.map.spatialReference;
              esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandler, locateResult), lang.hitch(this, this.geometryService_faultHandler));
            }
          }
          result.push(locateResult);
          this.list.add(locateResult);
        }
      }));
      return result;
    },

    projectCompleteHandler: function projectCompleteHandler(results, locateResult) {
      locateResult.point = results[0];
    },

    _useExampleText: function _useExampleText() {
      var example = this.CoordHintText.innerHTML;
      var selUnit = this._unitArr[this.unitdd.get('value')];
      if (selUnit.mapref) {
        var exampleArr = this._regexMatchAll(example, /(((?=[^0-9])\s-)?[a-zA-Z0-9.]+)/g); // The ((?=[^0-9])\s-)? allows us to discard - from "M35:8858-4457" but capture -43.607 from "172.715, -43.607"
        this.mapSheetDD.set('value', this._strTrim(exampleArr[0][0]));
        this.xCoordTextBox.set('value', this._strTrim(exampleArr[1][0]));
        this.yCoordTextBox.set('value', this._strTrim(exampleArr[2][0]));
      } else {
        var exampleArr = example.split(','); // Don't rely on regex for normal coords as WGS84 has lots of variations which can trip up above regex
        this.xCoordTextBox.set('value', this._strTrim(exampleArr[0]));
        this.yCoordTextBox.set('value', this._strTrim(exampleArr[1]));
      }
    },

    _regexMatchAll: function _regexMatchAll(str, regexp) {
      var matches = [];
      str.replace(regexp, function () {
        var arr = [].slice.call(arguments, 0);
        var extras = arr.splice(-2);
        arr.index = extras[0];
        arr.input = extras[1];
        matches.push(arr);
      });
      return matches.length ? matches : null;
    },

    _strTrim: function _strTrim(str) {
      return str.replace(/ +(?= )/g, '');
    },

    _clear: function _clear() {
      html.setStyle(this.btnClear, 'display', 'none');
      html.setStyle(this.btnClear1, 'display', 'none');
      html.setStyle(this.btnClear2, 'display', 'none');
      this.disableTimer();
      this._hideInfoWindow();
      this.graphicsLayer.clear();
      if (this.list.items.length > 0 && this.isSelTabVisible()) {
        this.tabContainer.selectTab(this.selTab);
      }
      this.list.clear();
      this.divResultMessage.textContent = this.nls.noresultsfoundlabel;
      return false;
    },

    _copyFullCoordsToClipboard: function _copyFullCoordsToClipboard(evt) {
      this._copyToClipboard(evt.currentTarget, this._getFullCoordsStringFromInputs());
    },

    _copyXCoordToClipboard: function _copyXCoordToClipboard(evt) {
      this._copyToClipboard(evt.currentTarget, this._strTrim(this.xCoordTextBox.get('value')));
    },

    _copyYCoordToClipboard: function _copyYCoordToClipboard(evt) {
      this._copyToClipboard(evt.currentTarget, this._strTrim(this.yCoordTextBox.get('value')));
    },

    _copyMapSheetToClipboard: function _copyMapSheetToClipboard(evt) {
      this._copyToClipboard(evt.currentTarget, this.mapSheetDD.get('value'));
    },

    _copyToClipboard: function _copyToClipboard(tooltipTarget, textToCopy) {
      var s;

      html.setStyle(this.copytoclipboardTextBox, 'display', '');
      this.copytoclipboardTextBox.value = textToCopy;
      this.copytoclipboardTextBox.select();
      try {
        s = document.execCommand('copy');
      } catch (err) {
        s = false;
      }
      document.execCommand('copy');
      html.setStyle(this.copytoclipboardTextBox, 'display', 'none');

      var t = s ? this.nls.copysuccessful : this.nls.copyfailed;
      this.showToolTip(tooltipTarget, t);
    },

    showToolTip: function showToolTip(target, withText) {
      Tooltip.show(withText, target);
      setTimeout(function () {
        Tooltip.hide(target);
      }, 1000);
    },

    _getFullCoordsStringFromInputs: function _getFullCoordsStringFromInputs() {
      var selUnit = this._unitArr[this.unitdd.get('value')];

      var x = this._strTrim(this.xCoordTextBox.get('value'));
      var y = this._strTrim(this.yCoordTextBox.get('value'));

      if (selUnit.mapref) {
        return this.mapSheetDD.get('value') + ':' + x + '-' + y;
      } else {
        return x + ', ' + y;
      }
    },

    _removeResultItem: function _removeResultItem(index, item) {
      var locResult = this.list.items[this.list.selectedIndex];
      this.locateResultArr.splice(this.locateResultArr.indexOf(locResult), 1);
      this.graphicsLayer.remove(locResult.graphic);
      this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.locateResultArr.length;
      if (this.locateResultArr.length === 0) {
        this._clear();
        this.disableTimer();
        this._hideInfoWindow();
        return;
      }
      this.list.remove(index);
      this.disableTimer();
      this._hideInfoWindow();
    },

    _overResultItem: function _overResultItem(index, item) {
      this.disableTimer();
      if (!this.map.infoWindow.isShowing) {
        var locResult = this.list.items[index];
        if (this.enableMoverRec) {
          this.showLocation(locResult);
        }
      }
    },

    _outResultItem: function _outResultItem(index, item) {
      if (this.autoCloseNum != Number.NEGATIVE_INFINITY) {
        if (this.enableMoverRec) {
          this.timedClose();
        }
      }
    },

    _selectResultItem: function _selectResultItem(index, item) {
      var locResult = this.list.items[index];
      this.showLocation(locResult);
    },

    _showError: function _showError(message) {
      html.setStyle(this.errorText, 'display', '');
      this.errorText.innerHTML = message;
    },

    _hideError: function _hideError() {
      html.setStyle(this.errorText, 'display', 'none');
      this.errorText.innerHTML = '';
    },

    _toggleMapClickCapture: function _toggleMapClickCapture() {
      if (this.isCapturingCoordsFromMap) {
        // Stop capturing
        domClass.remove(this.CoordInputBtns_Map, 'btn-active');
        domAttr.set(this.CoordInputBtns_Map, 'title', this.nls.mapInputButtonTitle);
      } else {
        // Start capturing
        domClass.add(this.CoordInputBtns_Map, 'btn-active');
        domAttr.set(this.CoordInputBtns_Map, 'title', this.nls.mapInputButtonTitleStop);
      }
      this.isCapturingCoordsFromMap = !this.isCapturingCoordsFromMap;
    },

    _onMapClick: function _onMapClick(event) {
      if (this.isCapturingCoordsFromMap) {
        this._usePointCoords(event.mapPoint);
      }
    },

    prelocateCoords: function prelocateCoords() {
      this._hideError();
      var long = this.xCoordTextBox.get('value');
      var lat = this.yCoordTextBox.get('value');
      var sheet = this.mapSheetDD.get('value');
      var selUnit = this._unitArr[this.unitdd.get('value')];
      if (long && lat && (sheet || !selUnit.mapref)) {
        var numLong = parseFloat(long);
        var numLat = parseFloat(lat);
        if (selUnit.wkid === this.map.spatialReference.wkid && !selUnit.mapref || selUnit.wgs84option == "map") {
          this.locateCoordinates();
        } else {
          this.tabContainer.selectTab(this.nls.resultslabel);
          html.setStyle(this.progressBar.domNode, 'display', 'block');
          html.setStyle(this.divResult, 'display', 'none');
          var point, wmPoint;

          if (selUnit.wkid == 4326) {
            if (selUnit.wgs84option == "dms") {
              numLong = this._wgs84MatchCoordFormatDMS(this, this.xCoordTextBox.get('value'));
              numLat = this._wgs84MatchCoordFormatDMS(this, this.yCoordTextBox.get('value'));
            } else if (selUnit.wgs84option == "dm" || selUnit.wgs84option == "ddm") {
              numLong = this._wgs84MatchCoordFormatDM(this, this.xCoordTextBox.get('value'));
              numLat = this._wgs84MatchCoordFormatDM(this, this.yCoordTextBox.get('value'));
            } else if (selUnit.wgs84option == "dd") {
              numLong = this._wgs84MatchCoordFormatD(this, this.xCoordTextBox.get('value'));
              numLat = this._wgs84MatchCoordFormatD(this, this.yCoordTextBox.get('value'));
            }
            point = new Point(numLong, numLat, new SpatialReference(parseInt(selUnit.wkid)));
            if (webMercatorUtils.canProject(point, this.map)) {
              wmPoint = webMercatorUtils.project(point, this.map);
              this.projectCompleteHandler2([wmPoint]);
              return;
            }
          } else if (selUnit.mapref) {
            var lenWkids = this.config.mapSheets.length;
            var validCoords = true;
            for (var i = 0; i < lenWkids; i++) {
              if (this.config.mapSheets[i].wkid == selUnit.wkid) {
                var lenSheets = this.config.mapSheets[i].sheets.length;
                for (var j = 0; j < lenSheets; j++) {
                  if (this.config.mapSheets[i].sheets[j].sheet == sheet) {
                    var mapSheet = this.config.mapSheets[i].sheets[j];

                    // Convert the grid coordinates
                    // NOTE: parseInt is used to remove any decimal places before padding with 0's
                    //numLong = parseFloat(parseInt((mapSheet.xmin.toString().substring(0, 2) + long + '0000000')).toString().substring(0, 7));
                    //numLat = parseFloat(parseInt((mapSheet.ymin.toString().substring(0, 2) + lat + '0000000')).toString().substring(0, 7));

                    // Check for rollover in map sheet when determining what prefix to use in constructing coordinates
                    var coords = this.gridReferenceCoordinateExtraction(long, lat, mapSheet);
                    if (coords) {
                      numLong = coords.x;
                      numLat = coords.y;

                      // Validate - make sure within sheet bounds
                      if (numLong >= mapSheet.xmin && numLong <= mapSheet.xmax && numLat >= mapSheet.ymin && numLat <= mapSheet.ymax) {
                        point = new Point(numLong, numLat, new SpatialReference(parseInt(selUnit.wkid)));
                        if (webMercatorUtils.canProject(point, this.map)) {
                          wmPoint = webMercatorUtils.project(point, this.map);
                          this.projectCompleteHandler2([wmPoint]);
                          return;
                        }
                        break;
                      } else {
                        validCoords = false;
                      }
                    }
                    break;
                  }
                }
                break;
              }
            }

            // If we got this far there was an issue with coords
            if (!validCoords) {
              this.projectCompleteHandler2([{}]); // Dummy point to trigger error message
              return;
            }
          } else {
            point = new Point(numLong, numLat, new SpatialReference(parseInt(selUnit.wkid)));
            if (webMercatorUtils.canProject(point, this.map)) {
              wmPoint = webMercatorUtils.project(point, this.map);
              this.projectCompleteHandler2([wmPoint]);
              return;
            }
          }

          var projParams = new ProjectParameters();
          projParams.geometries = [point];
          projParams.outSR = this.map.spatialReference;
          esriConfig.defaults.geometryService.project(projParams, lang.hitch(this, this.projectCompleteHandler2), lang.hitch(this, this.geometryService_faultHandler));
        }
      }
    },

    gridReferenceCoordinateExtraction: function gridReferenceCoordinateExtraction(xText, yText, mapSheet) {
      if (!xText || !yText || !mapSheet) {
        return null;
      }

      var x, y;

      var xVal = (xText + "00000").substring(0, 5);
      var yVal = (yText + "00000").substring(0, 5);

      var minYPref = mapSheet.ymin.toString().substring(0, 2);
      var minXPref = mapSheet.xmin.toString().substring(0, 2);
      var maxYPref = mapSheet.ymax.toString().substring(0, 2);
      var maxXPref = mapSheet.xmax.toString().substring(0, 2);

      var minY = parseInt(mapSheet.ymin.toString().substring(2, 7));
      var minX = parseInt(mapSheet.xmin.toString().substring(2, 7));
      var maxY = parseInt(mapSheet.ymax.toString().substring(2, 7));
      var maxX = parseInt(mapSheet.xmax.toString().substring(2, 7));

      if (minY > maxY || minX > maxX) {
        if (minY <= parseInt(yVal) && parseInt(yVal) < 100000) {
          y = parseFloat(parseInt(minYPref + yVal));
        } else {
          y = parseFloat(parseInt(maxYPref + yVal));
        }

        if (minX <= parseInt(xVal) && parseInt(xVal) < 100000) {
          x = parseFloat(parseInt(minXPref + xVal));
        } else {
          x = parseFloat(parseInt(maxXPref + xVal));
        }
      } else {
        y = parseFloat(parseInt(minYPref + yVal));
        x = parseFloat(parseInt(minXPref + xVal));
      }

      return {
        "x": x,
        "y": y
      };
    },

    projectCompleteHandler2: function projectCompleteHandler2(results) {
      this.disableTimer();
      this._hideInfoWindow();
      this.list.clear();
      if (this.locateResultArr) {
        this.locateResultArr = [];
      }

      if (isNaN(results[0].x) || isNaN(results[0].y)) {
        this._showError(this.nls.errorInvalidCoordinates);
        this.tabContainer.selectTab(this.nls.coordslabel);
      } else {
        try {
          var long = this.xCoordTextBox.get('value');
          var lat = this.yCoordTextBox.get('value');
          var sheet = this.mapSheetDD.get('value');
          var selUnit = this._unitArr[this.unitdd.get('value')];
          if (long && lat && (sheet || !selUnit.mapref)) {
            var locateResult = {};
            locateResult.sym = this.coordMarkerSymbol;
            locateResult.title = this.nls.coordslabel;
            locateResult.content = locateResult.rsltcontent = "<em>" + this.nls.location + "</em>: " + this._getFullCoordsStringFromInputs();
            locateResult.point = results[0];
            locateResult.alt = false;
            locateResult.id = 'id_1';

            this.locateResultArr = [locateResult];
            this.list.add(locateResult);
            this.showLocation(locateResult);

            this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.locateResultArr.length;
          }
        } catch (error) {
          console.info(error);
        }
      }
      html.setStyle(this.progressBar.domNode, 'display', 'none');
      html.setStyle(this.divResult, 'display', 'block');
    },

    geometryService_faultHandler: function geometryService_faultHandler(err) {
      console.info(err);
      html.setStyle(this.progressBar.domNode, 'display', 'none');
      html.setStyle(this.divResult, 'display', 'block');
    },

    locateCoordinates: function locateCoordinates() {
      this.disableTimer();
      this._hideInfoWindow();
      this.list.clear();
      if (this.locateResultArr) {
        this.locateResultArr = [];
      }

      try {
        var long = this.xCoordTextBox.get('value');
        var lat = this.yCoordTextBox.get('value');
        if (long && lat) {
          var numLong = Number(long);
          var numLat = Number(lat);
          if (!isNaN(numLong) && !isNaN(numLat)) {
            this.tabContainer.selectTab(this.nls.resultslabel);
            html.setStyle(this.progressBar.domNode, 'display', 'block');
            html.setStyle(this.divResult, 'display', 'none');
            var locateResult = {};
            locateResult.sym = this.coordMarkerSymbol;
            locateResult.title = this.nls.coordslabel;
            locateResult.content = locateResult.rsltcontent = "<em>" + this.nls.location + "</em>: " + long + ", " + lat;
            locateResult.point = new Point(numLong, numLat, this.map.spatialReference);
            locateResult.alt = false;
            locateResult.id = 'id_1';

            this.locateResultArr = [locateResult];
            this.list.add(locateResult);
            this.showLocation(locateResult);

            this.divResultMessage.textContent = this.nls.resultsfoundlabel + ' ' + this.locateResultArr.length;

            html.setStyle(this.progressBar.domNode, 'display', 'none');
            html.setStyle(this.divResult, 'display', 'block');
          }
        }
      } catch (error) {
        console.info(error);
      }
    },

    showLocation: function showLocation(locResult) {
      this._hideInfoWindow();
      this.graphicsLayer.clear();

      var ptGraphic = new Graphic(locResult.point);
      ptGraphic.setSymbol(locResult.sym);
      var Atts = {
        content: locResult.content,
        title: locResult.title,
        gid: parseInt(locResult.id.replace('id_', '')),
        name: locResult.content.replace(/(<([^>]+)>)/ig, "")
      };
      ptGraphic.attributes = Atts;
      this.graphicsLayer.add(ptGraphic);

      locResult.graphic = ptGraphic;
      if (this.forceScale === true) {
        this._setScaleAndCenter(locResult);
      } else {
        if (this.map.getScale() > this.zoomScale) {
          this._setScaleAndCenter(locResult);
        } else {
          this.map.centerAt(locResult.point).then(lang.hitch(this, function () {
            this.showInfoWin(locResult);
          }));
        }
      }

      html.setStyle(this.btnClear, 'display', '');
      html.setStyle(this.btnClear1, 'display', '');
      html.setStyle(this.btnClear2, 'display', '');
    },

    _getWidgetConfig: function _getWidgetConfig(widgetName) {
      var widgetCnfg = null;
      array.some(this.wManager.appConfig.widgetPool.widgets, function (aWidget) {
        if (aWidget.name == widgetName) {
          widgetCnfg = aWidget;
          return true;
        }
        return false;
      });
      if (!widgetCnfg) {
        /*Check OnScreen widgets if not found in widgetPool*/
        array.some(this.wManager.appConfig.widgetOnScreen.widgets, function (aWidget) {
          if (aWidget.name == widgetName) {
            widgetCnfg = aWidget;
            return true;
          }
          return false;
        });
      }
      return widgetCnfg;
    },

    _setScaleAndCenter: function _setScaleAndCenter(locResult) {
      this.map.setScale(this.zoomScale).then(setTimeout(lang.hitch(this, function () {
        this.map.centerAt(locResult.point).then(lang.hitch(this, function () {
          this.showInfoWin(locResult);
        }));
      }), 1000));
    },

    infoWindowShow: function infoWindowShow(locateResult) {
      if (this.map.infoWindow) {
        locateResult.graphic.setInfoTemplate(this._configurePopupTemplate(locateResult));
        if (typeof this.map.infoWindow.setFeatures === 'function') {
          this.map.infoWindow.setFeatures([locateResult.graphic]);
        }
        if (typeof this.map.infoWindow.reposition === 'function') {
          this.map.infoWindow.reposition();
        }
        this.map.infoWindow.show(locateResult.point);
      }
    },

    //mouse over graphic
    mouseOverGraphic: function mouseOverGraphic(event) {
      this.disableTimer();
      var gra = event.graphic;
      if (gra.attributes) {
        var locResult = this.getResultByGID(gra.attributes.gid);
        if (this.map.extent.contains(locResult.point)) {
          this.showLocation(locResult);
          if (this.autoCloseNum != Number.NEGATIVE_INFINITY) {
            this.timedClose();
          }
        } else {
          this._hideInfoWindow();
        }
      }
    },

    getResultByGID: function getResultByGID(gid) {
      var retResult;
      for (var i = 0; i < this.locateResultArr.length; i++) {
        var sr = this.locateResultArr[i];
        if (parseInt(sr.id.replace('id_', '')) === gid) {
          retResult = sr;
          break;
        }
      }
      return retResult;
    },

    timedClose: function timedClose() {
      clearTimeout(this.timer);
      this.timer = setTimeout(lang.hitch(this, function () {
        this._hideInfoWindow();
      }), this.autoCloseNum);
    },

    disableTimer: function disableTimer() {
      clearTimeout(this.timer);
    },

    showInfoWin: function showInfoWin(locResult) {
      if (this.map.infoWindow) {
        locResult.graphic.setInfoTemplate(this._configurePopupTemplate(locResult));
        this.map.infoWindow.setFeatures([locResult.graphic]);
        if (this.map.infoWindow.reposition) {
          this.map.infoWindow.reposition();
        }
        this.map.infoWindow.show(locResult.point.offset(15, 0));
      }
    },

    _initProgressBar: function _initProgressBar() {
      this.progressBar = new ProgressBar({
        indeterminate: true
      }, this.progressbar);
      html.setStyle(this.progressBar.domNode, 'display', 'none');
    },

    _configurePopupTemplate: function _configurePopupTemplate(listItem) {
      var popUpInfo = {};
      popUpInfo.title = '{title}';
      popUpInfo.description = '{content}';
      var pminfos = [];
      var popUpMediaInfo;
      var pt = new PopupTemplate(popUpInfo);
      return pt;
    },

    destroy: function destroy() {
      if (this.drawToolBar) {
        this.drawToolBar.deactivate();
      }

      if (this.drawLayer) {
        if (this.map) {
          this.map.removeLayer(this.drawLayer);
        }
      }

      this.drawToolBar = null;
      this.drawLayer = null;
      this.inherited(arguments);
    },

    onOpen: function onOpen() {
      if (this.graphicsLayer) {
        this.graphicsLayer.show();
      }
      this.infoWinMouseOver = on(this.map.infoWindow.domNode, 'mouseover', lang.hitch(this, function () {
        this.disableTimer();
      }));

      this.infoWinMouseOut = on(this.map.infoWindow.domNode, 'mouseout', lang.hitch(this, function () {
        if (this.autoCloseNum != Number.NEGATIVE_INFINITY) {
          this.timedClose();
        }
      }));
    },

    onDeActive: function onDeActive() {
      this.drawToolBar.deactivate();
    },

    onClose: function onClose() {
      this._hideInfoWindow();
      this.graphicsLayer.hide();

      this.infoWinMouseOver.remove();
      this.infoWinMouseOut.remove();
    },

    onMinimize: function onMinimize() {
      this._hideInfoWindow();
      if (this.graphicsLayer) {
        this.graphicsLayer.hide();
      }
    },

    _hideInfoWindow: function _hideInfoWindow() {
      if (this.map && this.map.infoWindow) {
        this.map.infoWindow.hide();
        this.map.infoWindow.setTitle('');
        this.map.infoWindow.setContent('');
      }
    },

    _addThemeFixes: function _addThemeFixes() {
      /*Workaround for the LanunchPad theme not firing onClose and onOpen for the widget*/
      if (this.appConfig.theme.name === "LaunchpadTheme") {
        var tPanel = this.getPanel();
        if (tPanel) {
          aspect.after(tPanel, "onClose", lang.hitch(this, this.onClose));
          aspect.after(tPanel, "onOpen", lang.hitch(this, this.onOpen));
        }
      }
      /*end work around for LaunchPad*/
      /*Workaround for TabTheme moregroup not calling onClose and onOpen when the SidebarController is minimized*/
      if (this.appConfig.theme.name === "TabTheme") {
        var sidebarWidget = this.wManager.getWidgetsByName('SidebarController');
        if (sidebarWidget[0]) {
          aspect.after(sidebarWidget[0], "onMinimize", lang.hitch(this, this.onClose));
          aspect.after(sidebarWidget[0], "onMaximize", lang.hitch(this, this.onOpen));
        }
      }
    },

    /*
    Attempt to match DEGREES coord format
    Returns matchedCoords if successful
     Matches decimal lat lng, such as:
    -42.493365
    172.385101
    -42
    172
    -42.493365S
    42.493365S
    -42.493365 S
    42.493365 S
    -176.433333
    -176.433333 W
    176.433333 W
    172.385101E
    -42.493365°
    172.385101°
    */
    _wgs84MatchCoordFormatD: function _wgs84MatchCoordFormatD(context, value) {
      var matches = /^\s*(-?\d{2,3}(?:\.\d*)?)\s*([nsewNSEW])?\D?\s*$/.exec(value);
      if (matches != null) {
        var coord = parseFloat(matches[1]);
        var compass = matches[2];

        coord = context._wgs84ApplyCompass(coord, compass);

        return coord;
      }
    },

    /*
    Attempt to match DEGREES & MINUTES coord format
    Returns matchedCoords if successful
       Matches lat lng, such as:
    -38 29.295
    38 29.295S
    -38 29.295S
    178 3.515E
    43°36'S
    -43°36'
    172°43'E
    172-40.33 E
    */
    _wgs84MatchCoordFormatDM: function _wgs84MatchCoordFormatDM(context, value) {
      var matches = /^\s*(-?\d{2,3})\D+(\d{1,2}(\.\d+)?)[^nsewNSEW]?\s*([nsewNSEW])?\s*$/.exec(value);
      if (matches != null) {
        var degrees = parseInt(matches[1]);
        var minutes = parseFloat(matches[2]);
        var compass = matches[4];

        var coord = degrees + minutes / 60;
        coord = context._wgs84ApplyCompass(coord, compass);

        return coord;
      }
    },

    /*
    Attempt to match DEGREES, MINUTES & SECONDS coord format
    Returns matchedCoords if successful
       Matches lat lng, such as:
    -38°29′18″
    38°29′18″S
    178°03′31″
    178°03′31″E
    38°29′18.123″S
    178°03′31.123″E
    172-40-1.45 E
    */
    _wgs84MatchCoordFormatDMS: function _wgs84MatchCoordFormatDMS(context, value) {
      var matches = /^\s*(-?\d{2,3})\D+(\d{1,2})\D+(\d{1,2}(?:\.\d*)?)[^nsewNSEW]?\s*([nsewNSEW])?\s*$/.exec(value);
      if (matches != null) {
        var degrees = parseInt(matches[1]);
        var minutes = parseInt(matches[2]);
        var seconds = parseFloat(matches[3]);
        var compass = matches[4];

        var coord = degrees + (minutes + seconds / 60) / 60;
        coord = context._wgs84ApplyCompass(coord, compass);

        return coord;
      }
    },

    /*
    Helper to adjust WGS84 coordinate value based on N/S/E/W compass direction being present
    */
    _wgs84ApplyCompass: function _wgs84ApplyCompass(coord, compass) {
      if (compass != null) {
        compass = compass.toUpperCase();
        if (coord > 0 && compass == 'S' || compass == 'W') {
          coord = coord * -1;
        }
      }
      return coord;
    }

  });
});
