define([
	"dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/on",
    "dojo/Deferred",
    'dojo/query',

    "dojo/dom-class",
    "dojo/dom-construct",
    'dojo/dom-style',

    "dijit/Viewport",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/text!./templates/EditFeaturePane.html",
    "dojo/i18n!../nls/strings",

    "dijit/form/Button",

    "esri/toolbars/edit",    
    "esri/dijit/AttributeInspector",

    './../libs/automapper'       
],
function (
	declare, 
    lang, 
    arrayUtils, 
    on, 
    Deferred,
    dojoQuery,

    domClass, 
    domConstruct,
    domStyle,

    Viewport, 
    _WidgetBase, 
    _TemplatedMixin, 
    _WidgetsInTemplateMixin, 
    template, 
    i18n,

    Button,

    Edit,
    AttributeInspector,

    automapperUtil
) {
	return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
	   	
	   	i18n: i18n,
		templateString: template,
		wabWidget: null,
        map: null,

        currentUpdateFeature: null,
        currentTargetTemplate: null,

        editToolbar: null,
        attributeInspector: null,

        _editMode: "create",
        _active: false,
        _editToolActive: false,
        geometryChanged: false,

      	postCreate: function() {
        	this.inherited(arguments);
        	this.own(Viewport.on("resize",this.resize()));
            this.map = this.wabWidget.map;
      	},

      	destroy: function() {
        	this.inherited(arguments);
        	//console.warn("AddFromFilePane::destroy");
      	},

      	startup: function() {
        	if (this._started) {
        		return;
        	}

		    this.inherited(arguments);

        	var self = this;
        	self.config = this.wabWidget.config;

            //setup the eidt tools
            this._setupEditTools();
        },

        resize: function () {

        },

        setEditFeature : function (recordTemplate, editMode) {
            if (editMode) {
                this.editMode = editMode;
            }
            else {
                this.editMode = "create";
            }

            this._updateUI();

            if (recordTemplate) {
                //check if layer loaded
                if (recordTemplate.displayLayer.loaded) {
                    this._refreshAttributeEditor(recordTemplate);
                } else {
                    var cacheLayerHandler = on(recordTemplate.displayLayer, "load", 
                        lang.hitch(this, function () {
                            cacheLayerHandler.remove();
                            this._refreshAttributeEditor(recordTemplate);
                        })
                    );
                return;              }
            } else {
                alert('no template');
            }
        },

        clearEditFeature : function () {
            this.editMode = "create";


        },


        /*---------------------------------------------------------
          UI AND SETUP FUNCTIONS */

        //update the application ui to reflect the current edit mode - create or update
        _updateUI: function () {
            var labelOverrides = this.wabWidget.config.labelOverrides;

            if (this.editMode == "update") {
                if (labelOverrides.edit.instructionUpdate && labelOverrides.edit.instructionUpdate !== '') {
                    this._setNodeHTML(this.instructionsDiv, labelOverrides.edit.instructionUpdate);
                } else {
                    this._setNodeHTML(this.instructionsDiv, this.i18n.edit.instructionUpdate);
                }
            }
            else {
                if (labelOverrides.edit.instructionCreate && labelOverrides.edit.instructionCreate !== '') {
                    this._setNodeHTML(this.instructionsDiv, labelOverrides.edit.instructionCreate);
                } else {
                    this._setNodeHTML(this.instructionsDiv, this.i18n.edit.instructionCreate);
                }
            }
        },

        //update the attribute editor field visibility 
        _updateAttributeEditorFields: function () {
            if (this.attributeInspector) {
                //get the field infos of the only layer in the application
                var infos = this.attributeInspector.layerInfos[0].fieldInfos;                

                var atiNodes = dojoQuery(".atiLabel");

                arrayUtils.forEach(atiNodes, lang.hitch(this, 
                    function (atiNode) {
                        var fieldIDAttr = atiNode.attributes["data-fieldname"];
                        if (fieldIDAttr && fieldIDAttr.value) {
                            var fieldName = fieldIDAttr.value;

                            arrayUtils.forEach(infos, lang.hitch(this, 
                                function (info) {
                                    if (info.fieldName === fieldName && !info.visible) {
                                        //get row
                                        var row = info.dijit.domNode.parentNode.parentNode;
                                        
                                        //hide row
                                        domStyle.set(row, "display", "none");
                                    }
                                })
                            );
                        }
                    })
                );
            }
        },


        //enable and setip the geometry editing
        _setupEditTools: function () {
            this.editToolbar = new Edit(this.map);

           // edit events
            this.own(on(this.editToolbar,
              "graphic-move-stop, rotate-stop, scale-stop, vertex-move-stop, vertex-click",
              lang.hitch(this, this._geometryEdited)));
        },

        _refreshAttributeEditor: function (recordTemplate) {
            //reset the attribute inspector
            this._clearAttributeInspector();

            //check if inspector is focussed on current edit layer
            if (this.attributeInspector === null) {
                this.currentTargetTemplate = recordTemplate;

                //prepare attribute inspector
                var fieldInfos = this._mapFields(recordTemplate.fieldInfos, this.editMode === "update");
                var layerInfos = [
                    {
                        'featureLayer': recordTemplate.displayLayer,
                        'showAttachments': false,
                        'isEditable': true,
                        'showDeleteButton': false,
                        'fieldInfos': fieldInfos
                    }
                ];

                //create a new attribute inspector
                this.attributeInspectorDiv = domConstruct.create("div");
                domConstruct.place(this.attributeInspectorDiv,this.layerDetailsDiv,"after");
                this.attributeInspector = new AttributeInspector({
                    layerInfos: layerInfos
                }, this.attributeInspectorDiv );
                //add handler to update the feature attributes when the ui is updated.
                this.attributeInspector.on("attribute-change", lang.hitch( this, function (evt) {
                    var feature = evt.feature;
                    feature.attributes[evt.fieldName] = evt.fieldValue;
                    feature.getLayer().applyEdits(null, [feature], null);                    
                }));

                //add in edit geometry button
                if (this.config.allowEditExisting) {
                    var editGeometryLabel = this.config.labelOverrides.edit.editGeometryLabel === "" ? this.i18n.edit.editGeometryLabel : this.config.labelOverrides.edit.editGeometryLabel;
                    var editGeometryTooltip = this.config.labelOverrides.edit.editGeometryTooltip === "" ? this.i18n.edit.editGeometryTooltip : this.config.labelOverrides.edit.editGeometryTooltip;

                    this.editGeometryButton = new Button({
                        label: editGeometryLabel,
                        title: editGeometryTooltip,
                        class: "atiButton atiEditGeometryButton"
                    });
                    this.attributeInspector.editButtons.insertBefore(this.editGeometryButton.domNode, 
                        this.attributeInspector.editButtons.childNodes[0]);
                    this.editGeometryButton.startup();
                    this.editGeometryButtonClickHandle = this.editGeometryButton.on("click", lang.hitch(this, 
                        function (evt) {
                            this._toggleGeometryTools();
                            //this._toggleEditTool();
                        })
                    );

                    this._createGeometryTools();

                }


                //add in request statement
                if (this.config.allowStatementRequest && recordTemplate && recordTemplate.apiSettings.mappingClass === 'ENQ') { 
                    var requestStatementLabel = this.config.labelOverrides.edit.requestStatementLabel === "" ? this.i18n.edit.requestStatementLabel : this.config.labelOverrides.edit.requestStatementLabel;
                    var requestStatementTooltip = this.config.labelOverrides.edit.requestStatementTooltip === "" ? this.i18n.edit.requestStatementTooltip : this.config.labelOverrides.edit.requestStatementTooltip;

                    this.requestButton = new Button({
                        label: requestStatementLabel,
                        title: requestStatementTooltip,
                        class: "atiButton atiRequestButton"
                    });
                    this.attributeInspector.editButtons.appendChild(this.requestButton.domNode);
                    this.requestButton.startup();
                    this.requestButtonClickHandle = this.requestButton.on("click", lang.hitch(this, 
                        function (evt) {
                        this._confirm(this.i18n.edit.requestStatementConfirm, 
                            lang.hitch(this, function () {
                                //hide the message box
                                this.wabWidget.hideMessage();

                                //get the current selection record
                                var rec = this.attributeInspector._selection[0];                                

                                //call the request statement process
                                this.wabWidget.requestStatement({
                                    features: [rec]
                                 });
                            }), "warning");
                        })
                    );
                }


                //add in submit
                var submitLabel = this.config.labelOverrides.edit.submitLabel === "" ? this.i18n.edit.submitLabel : this.config.labelOverrides.edit.submitLabel;
                var submitTooltip = this.config.labelOverrides.edit.submitTooltip === "" ? this.i18n.edit.submitTooltip : this.config.labelOverrides.edit.submitTooltip;

                this.submitButton = new Button({
                    label: submitLabel,
                    title: submitTooltip,
                    class: "atiButton atiSubmitButton"
                });
                this.attributeInspector.editButtons.appendChild(this.submitButton.domNode);
                this.submitButton.startup();
                this.submitButtonClickHandle = this.submitButton.on("click", lang.hitch(this, 
                    function (evt) {
                        this._confirm(this.i18n.edit.submitConfirm, 
                            lang.hitch(this, function () {
                                //hide the message box
                                this.wabWidget.hideMessage();

                                //deactivate edit tools
                                this._toggleEditTool(true);

                                //get the current selection record
                                var rec = this.attributeInspector._selection[0];

                                //determine record type
                                var recordType = this.currentTargetTemplate.apiSettings.mappingClass;
                                var saveRec = automapperUtil.map('graphic',recordType, rec);

                                //call the widget
                                this.wabWidget.saveChanges(rec, saveRec);
                            }), "warning");


                        /*
                        var c = confirm(this.i18n.edit.submitConfirm);
                        if (c) {
                            var rec = this.attributeInspector._selection[0];

                            //determine record type
                            var recordType = this.currentTargetTemplate.apiSettings.mappingClass;
                            var saveRec = automapperUtil.map('graphic',recordType, rec);

                            //calll the widget
                            this.wabWidget.saveChanges(rec, saveRec);
                        }
                        */
                    })
                );

                //add in cancel
                var cancelLabel = this.config.labelOverrides.edit.cancelLabel === "" ? this.i18n.edit.cancelLabel : this.config.labelOverrides.edit.cancelLabel;
                var cancelTooltip = this.config.labelOverrides.edit.cancelTooltip === "" ? this.i18n.edit.cancelTooltip : this.config.labelOverrides.edit.cancelTooltip;

                this.cancelButton = new Button({
                    label: cancelLabel,
                    title: cancelTooltip,
                    class: "atiButton atiCancelButton"
                });
                this.attributeInspector.editButtons.appendChild(this.cancelButton.domNode);
                this.cancelButton.startup();
                this.cancelButtonClickHandle = this.cancelButton.on("click", lang.hitch(this, 
                    function (evt) {
                        this._confirm(this.i18n.edit.cancelConfirm, 
                            lang.hitch(this, function () {
                                //hide the message box
                                this.wabWidget.hideMessage();

                                //deactivate edit tools
                                this._toggleEditTool(true);

                                //call cancel job
                                this.wabWidget.cancelChanges();                              
                            }), "warning");
                    })
                );
            } 

            this.attributeInspector.refresh();
            this._updateAttributeEditorFields();
        },

        //clear the attribute inspector details for the current feature
        _clearAttributeInspector: function () {
            if ( this.attributeInspector !== null ) {

                //clear attached components and events
                if (this.atttributeInspectorDelete) {
                    this.atttributeInspectorDelete.remove();
                }

                if (this.cancelButtonClickHandle) {
                    this.cancelButtonClickHandle.remove();
                }

                if (this.cancelButton) {
                    this.cancelButton.destroy();
                }

                if (this.submitButtonClickHandle) {
                    this.submitButtonClickHandle.remove();                   
                }

                if (this.submitButton) {
                    this.submitButton.destroy();
                }

                if (this.requestButtonClickHandle) {
                    this.requestButtonClickHandle.remove();
                }

                if (this.requestButton) {
                    this.requestButton.destroy();
                }

                if (this.editGeometryButtonClickHandle) {
                    this.editGeometryButtonClickHandle.remove();
                }

                if (this.editGeometryButton) {
                    this.editGeometryButton.destroy();
                }

                //remove current inspector
                this.attributeInspector.destroy();
                this.attributeInspector = null;
            } 
        },

        /*---------------------------------------------------------
          EDIT TOOLS AND FUNCTIONS */

        //toggle the visibility of the geometry edit tools
        _toggleGeometryTools: function (forceOff) {
            if (this._geometryToolsActive || forceOff) {

            }
            else {


                //Add explode tool


                //Add cut tool

                //Add merge tool

                //Add copy tool


            }


        },

        _createGeometryTools: function () {
            if (this._geometryTools) {
                domConstruct.destroy(this._geometryTools);
            }

            this._geometryTools = domConstruct.create("div", {
              "class": "atiButtons esriCTGeometryEditor"
            }, this.editGeometryButton.domNode, "after");
//hidden
            this._createCutTool();
            //this._createMergeTool();
            //this._createExplodeTool();
        },

        _createCutTool: function () {
            //Cut Button - construct the button
            if (this._featureCut) {
                // Deactivate the click event
                if (this._cutClick) {
                  this._cutClick.remove();
                  this._cutClick = null;
                }
                domConstruct.destroy(this._featureCut);
            }

            this._featureCut = domConstruct.create("div", {
              "class": "esriCTCutFeatures esriCTGeometryEditor",
              "title": this.i18n.tools.cutToolTitle
            }, this._geometryTools, "last");
        },

        _createMergeTool: function () {
            //Merge Button - construct the button
            if (this._featureMerge) {
                // Deactivate the click event
                if (this._mergeClick) {
                  this._mergeClick.remove();
                  this._mergeClick = null;
                }
                domConstruct.destroy(this._featureMerge);
            }

            this._featureMerge = domConstruct.create("div", {
              "class": "esriCTMergeFeatures esriCTGeometryEditor",
              "title": this.i18n.tools.mergeToolTitle
            }, this._geometryTools, "last");
        },

        _createExplodeTool: function () {
            //Explode Button - construct the button
            if (this._featureExplode) {
                // Deactivate the click event
                if (this._explodeClick) {
                  this._explodeClick.remove();
                  this._explodeClick = null;
                }
                domConstruct.destroy(this._featureExplode);
            }

            this._featureExplode = domConstruct.create("div", {
              "class": "esriCTExplodeFeatures esriCTGeometryEditor",
              "title": this.i18n.tools.explodeToolTitle
            }, this._geometryTools, "last");
        },

        //start geometry edit tool
        _toggleEditTool: function(forceOff) {
            if (this._editToolActive || forceOff) {
                //enable info window
                this.map.setInfoWindowOnClick(true);
                if (this.editToolbar.getCurrentState().tool !== 0) {
                    this.editToolbar.deactivate();
                }
                this._editToolActive = false;
            } 
            else {
                //disable info window
                this.map.setInfoWindowOnClick(false);

                //hide info window if showing
                if (this.map.infoWindow.isShowing) {
                    this.map.infoWindow.hide();
                }

                this._activateEditToolbar(this.wabWidget.currentFeature);
                this._editToolActive = true;  
            }
        },

        //preare the edit tools dropdown menu for the types of tool appropriate to the feature type geometry 
        _activateEditToolbar: function (feature) {
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
                    this.editToolbar.activate(Edit.EDIT_VERTICES |
                        Edit.MOVE |
                        Edit.ROTATE |
                        Edit.SCALE, feature);
                        /*jslint bitwise: false*/
                        break;
            } 
        },

        //handle edit toolbar complete action  
        _geometryEdited: function () {
            this.geometryChanged = true;
            //this._enableAttrInspectorSaveButton(this._validateAttributes());
        },

        _validateAttributes: function (changeDefaultState) {
            /*
            //optional param to determine if no rule is found, should it reset the state.
            //Required for when a form is disabled and a rule to hide a field is required
            changeDefaultState = typeof changeDefaultState !== 'undefined' && changeDefaultState !== null ? changeDefaultState : true;
            var attachmentValidationResult = [];
            var attachmentResult = true;
            var rowsWithGDBRequiredFieldErrors = this._validateRequiredFields();
            var featureHasEdits = this._validateFeatureChanged();

            var rowsWithSmartErrors = [];
            var formValid = true;
            if (this._smartAttributes !== undefined) {
                if (this._smartAttributes !== null) {
                    rowsWithSmartErrors = this._smartAttributes.toggleFields(changeDefaultState);
                }
            }
        
            if (this._attributeInspectorTools !== undefined) {
                if (this._attributeInspectorTools !== null) {
                    formValid = this._attributeInspectorTools.formValid();
                }
            }

            if (featureHasEdits && this.currentLayerInfo && this.currentLayerInfo.attachmentValidations) {
                arrayUtils.forEach(this.currentLayerInfo.attachmentValidations.Actions,
                    lang.hitch(this, function (action) {
                        var attachmentObj = {};
                        if (action.filter && this._smartAttributes) {
                            attachmentObj.actionType = action.actionName;
                            attachmentObj.result = this._smartAttributes.processFilter(action.filter);
                            attachmentValidationResult.push(attachmentObj);
                        }
                    })
                );

                //Perform action based on feature is being created or updated
                if (this.attrInspector._attachmentUploader) {
                    attachmentResult =
                        this.performAction(this.attrInspector._attachmentUploader, attachmentValidationResult, true);
                } else if (this.attrInspector._attachmentEditor) {
                    attachmentResult =
                        this.performAction(this.attrInspector._attachmentEditor, attachmentValidationResult, false);
                }
            }
            return (editUtils.isObjectEmpty(rowsWithGDBRequiredFieldErrors) &&
                rowsWithSmartErrors.length === 0 && formValid && featureHasEdits && attachmentResult);
            */
        },


        /*---------------------------------------------------------
          CUT FUNCTIONS */

        /**
        * This function is used to show/hide the explode features button depending upon certain conditions
        * @param {checked} : a state of the edit geometry checkbox. if checked show the icon else hide it
        */
        _toggleCutFeatureButtonVisibility: function (checked) {
            //if edit checkbox is checked and geometry supports merging
            if (!checked) {
                this._setCutHandler(false,"");
            } else {
                // Check geometry is line or polygon
                if (this.currentFeature.geometry.type === 'point') {
                    // Disable the explode tool and show unsupported geometry error message value
                    this._setCutHandler(false,"unsupported geometry");
                } else {
                    this._setCutHandler(true);
                }
            }
        },

        _setCutHandler: function (create, error) {
            if (create) {
                // Remove disable button style
                if (domClass.contains(this._featureCut, "hidden")) {
                  domClass.remove(this._featureCut, "hidden");
                }

                domAttr.set(this._featureCut, "title", this.nls.tools.cutToolTitle);

                // Apply the click event
                if (!this._cutClick) {
                  this._cutClick = on(this._featureCut, "click", lang.hitch(this, this._setCutMode));
                }


            } else {
                // Apply disable button style
                if (!domClass.contains(this._featureCut, "hidden")) {
                  domClass.add(this._featureCut, "hidden");
                }

                // Deactiviate the click event
                if (this._cutClick) {
                    this._cutClick.remove();
                    this._cutClick = null;
                }

                switch (error) {
                    case "unsupported geometry":
                        domAttr.set(this._featureCut, "title", this.nls.tools.cutErrors.unsupportedGeometryError);
                    break;


                    default:
                        domAttr.set(this._featureCut, "title", this.nls.tools.cutErrors.generalError);
                    break;
                }

            }
        },

        _setCutMode: function (reset) {
            if(reset === true || this._drawToolEditMode && this._drawToolEditType && this._drawToolEditType === 'CUT') {
                // Deactivate the cut tool
                this._drawToolEditMode = false;
                this._drawToolEditType = null;
                this.drawToolbar.deactivate();     

                this.map.setInfoWindowOnClick(true);

                // Remove active style on button
                this._applyEditToolButtonStyle('CUT', false);

            } else {
                // Check if another edit tool is active
                if (this._drawToolEditType !== 'CUT') {
                // disable this tool
                }

                // Activate the draw tool to define the cut line
                this._drawToolEditType = 'CUT';
                this._drawToolEditMode = true;
                this.drawToolbar.activate(Draw.POLYLINE, null);  

                this.map.setInfoWindowOnClick(false);

                // Remove active style on button
                this._applyEditToolButtonStyle('CUT', true);
            }
        },

        _cutFeatures: function (evt) {
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
                var newFeatures = [], newGeometry = null;
                for(var p=0,pl = newShapes.length;p<pl;p++) {
                    var newFeature = new Graphic(feature.toJson());
                    newGeometry = newShapes[p];
                    newFeature.setGeometry(newGeometry);
                    newFeatures.push(newFeature); 
                }

                var layer = feature.getLayer();
                layer.applyEdits(newFeatures, null, [feature],
                  lang.hitch(this, function (adds, updates, deletes) {
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
        },  



        /*---------------------------------------------------------
          EXPLODE FUNCTIONS */
        
        /**
        * This function is used to show/hide the explode features button depending upon certain conditions
        * @param {checked} : a state of the edit geometry checkbox. if checked show the icon else hide it
        */
        _toggleExplodeFeatureButtonVisibility: function (checked) {
            // //if edit checkbox is checked and geometry supports merging
            // if (!checked) {
            //   this._setExplodeHandler(false,"");
            // } else {
            //   // Check geometry is line or polygon
            //   if (this.currentFeature.geometry.type === 'point') {
            //     // Disable the explode tool and show unsupported geometry error message value
            //     this._setExplodeHandler(false,"unsupported geometry");
            //     return;
            //   } 

            //   // Check for multipart geometry
            //   var feature = null, process = '', geometry = null, newFeatures = [];
            //   feature = this.currentFeature;
            //   switch (feature.geometry.type) {
            //       case 'polyline':
            //           if (feature.geometry.paths.length > 0)
            //               process = 'paths';
            //           break;

            //       case 'polygon':
            //           if (feature.geometry.rings.length > 0)
            //               process = 'rings';
            //           break;

            //       default:
            //           break;
            //   }

            //   if (feature.geometry[process].length === 1) {
            //     // Disable the explode tool and show not multipart error message value
            //     this._setExplodeHandler(false,"not multipart");          
            //   } else {
            //     this._setExplodeHandler(true);
            //   }
            // }
        },

        _setExplodeHandler: function (create, error) {
        // if (create) {
        //     // Remove disable button style
        //     if (domClass.contains(this._featureExplode, "hidden")) {
        //       domClass.remove(this._featureExplode, "hidden");
        //     }

        //     domAttr.set(this._featureExplode, "title", this.nls.tools.explodeToolTitle);

        //     // Apply the click event
        //     if (!this._explodeClick) {
        //       this._explodeClick = on(this._featureExplode, "click", lang.hitch(this, this._startExplode));
        //     }


        // } else {
        //     // Apply disable button style
        //     if (!domClass.contains(this._featureExplode, "hidden")) {
        //       domClass.add(this._featureExplode, "hidden");
        //     }

        //     // Deactiviate the click event
        //     if (this._explodeClick) {
        //       this._explodeClick.remove();
        //       this._explodeClick = null;
        //     }

        //     switch (error) {
        //       case "unsupported geometry":
        //         domAttr.set(this._featureExplode, "title", this.nls.tools.explodeErrors.unsupportedGeometryError);
        //         break;

        //       case "not multipart":
        //         domAttr.set(this._featureExplode, "title", this.nls.tools.explodeErrors.notMultipartError);
        //         break;

        //       default:
        //         domAttr.set(this._featureExplode, "title", this.nls.tools.explodeErrors.generalError);
        //         break;
        //   }

        // }
        },

        _startExplode: function () {
        // var explodePopup, param;
        // param = {
        //     map: this.map,
        //     nls: this.nls,
        //     config: this.config,
        //     features: this.updateFeatures,
        //     currentFeature: this.currentFeature
        // };

        // explodePopup = new ExplodeFeatures(param);
        // explodePopup.startup();

        // explodePopup.onOkClick = lang.hitch(this, function() {
        //   this._explodeFeatures();
        //   explodePopup.popup.close();
        // });
        },

        _explodeFeatures: function () {
          // // Check for multipart geometry
          // var feature = null, process = '', geometry = null, newFeatures = [];
          // feature = this.currentFeature;
          // switch (feature.geometry.type) {
          //     case 'polyline':
          //         if (feature.geometry.paths.length > 0)
          //             process = 'paths';
          //         break;

          //     case 'polygon':
          //         if (feature.geometry.rings.length > 0)
          //             process = 'rings';
          //         break;

          //     default:
          //         break;
          // }

          // if (process !== '') {
          //     geometry = feature.geometry;
          //     for(var p=0,pl = geometry[process].length;p<pl;p++) {
          //         var newFeature = new Graphic(feature.toJson());
          //         var newGeometry = null;

          //         switch(process) {
          //             case 'rings':
          //                 newGeometry = new Polygon({ 
          //                     "rings":[
          //                         JSON.parse(JSON.stringify(geometry[process][p]))
          //                     ],
          //                     "spatialReference": geometry.spatialReference.toJson()
          //                 });
          //                 break;

          //             case 'paths':
          //                 newGeometry = new Polyline({ 
          //                     "paths":[
          //                         JSON.parse(JSON.stringify(geometry[process][p]))
          //                     ],
          //                     "spatialReference": geometry.spatialReference.toJson()
          //                 });
          //                 break;
          //         }
          //         newFeature.setGeometry(newGeometry);
          //         newFeatures.push(newFeature); 
          //     }
          // } else {
          //     newFeatures.push(feature);
          // }

          // // Apply the changes
          // var layer = this.currentFeature.getLayer();
          // layer.applyEdits(newFeatures, null, [feature],
          //   lang.hitch(this, function (adds, updates, deletes) {
          //     if (adds && updates.length > 0 && adds[0].hasOwnProperty("error")) {
          //       Message({
          //         message: adds[0].error.toString()
          //       });
          //     }
          //     if (deletes && deletes.length > 0 && deletes[0].hasOwnProperty("error")) {
          //       Message({
          //         message: deletes[0].error.toString()
          //       });
          //     }

          //     // Return to templates 
          //     this._showTemplate(true);

          //   }), lang.hitch(this, function (err) {
          //     Message({
          //       message: err.message.toString() + "\n" + err.details
          //     });
          //   }));
        },






        /*---------------------------------------------------------
          UTIL FUNCTIONS */

        _mapFields: function (originalFieldInfos, editmode) {
            var fieldInfos = [];
            var mapType = 'field';
            if (editmode) {
                mapType = 'fieldEditMode';
            }

            arrayUtils.forEach(originalFieldInfos, lang.hitch(this, 
                function (fld) {
                    fieldInfos.push(automapperUtil.map('fieldConfig', mapType, fld));
                })
            );

            return fieldInfos;
        },

        //display a confirm messagebox user has to answer to continue
        _confirm: function (message, callback, messagetype) {
            var buttons = [
                {
                    label: this.i18n.messagesDialog.confirmYes,
                    onClick: callback
                },{
                    label: this.i18n.messagesDialog.confirmNo,
                }
            ];

            this.wabWidget.showMessage(message, messagetype, buttons);
        },

        _setNodeText: function(nd, text) {
            nd.innerHTML = "";
            if (text) {
                nd.appendChild(document.createTextNode(text));
            }
        },

        _setNodeTitle: function(nd, text) {
            nd.title = "";
            if (text) {
                nd.setAttribute("title", text);
            }
        },

        _setNodeHTML: function(nd, html) {
            nd.innerHTML = "";
            if (html) {
                nd.innerHTML = html;
            }
        }

    });

});