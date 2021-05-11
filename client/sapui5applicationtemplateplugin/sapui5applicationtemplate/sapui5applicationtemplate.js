define(["sap/watt/lib/jszip/jszip-shim", "./shared"], function (JSZip,shared) {

	return function () {

		return {
			_MIN_UI5_VERSION: {
				TO_SUPPORT_FIORI_3_THEME: {
					str: "1.65.6",
					val: 1.656
				},
				TO_SUPPORT_UI5_V1_60_MODALIZATION: {
					str: "1.60.1",
					val: 1.601
				},
				TO_SUPPORT_BELIZE_THEME: {
					str: "1.40.12",
					val: 1.4012
				},
				TO_SUPPORT_CURRENT_TEMPLATE: {
					str: "1.30.0",
					val: 1.30
				}
			},

			configWizardSteps: function (oTemplateCustomizationStep) {},

			_parseUIVersion2Float: function (sUI5Version) {
				// parse number within first . in string for example: 1.54.12 -> 1.54
				var floatNum = 0;
				var floatUIVersion = parseFloat(sUI5Version);
				if (!isNaN(floatUIVersion)) {
					var aVersion = sUI5Version.split(".");
					// in case there is a third number in UI5 version
					if (aVersion.length >= 3 && !isNaN(aVersion[2])) {
						floatUIVersion = parseFloat((floatUIVersion + parseFloat("0.00" + aVersion[2])).toFixed(4));
					}
					return floatUIVersion;
				}
				// in case it is not legal (null/empty/undefined) then return original string
				return floatNum;
			},

			_setThemeInModelBasedOnUI5Version: function (model) {
				var SAP_HCB_THEME = "sap_hcb";
				var selectUI5Version = this._parseUIVersion2Float(model.selectedUI5Version);
				if (model.selectedUI5Version == null || model.selectedUI5Version.length === 0 || selectUI5Version >= this._MIN_UI5_VERSION.TO_SUPPORT_FIORI_3_THEME
					.val) {
					var FIORI_3_DEFAULT_THEME = "sap_fiori_3";
					model.ui5Config = {
						Theme: FIORI_3_DEFAULT_THEME
					};
				} else if (selectUI5Version >= this._MIN_UI5_VERSION.TO_SUPPORT_BELIZE_THEME.val) {
					var SAP_BELIZE_THEME = "sap_belize";
					var BELIZE_AVAILABLE_THEMES = [SAP_HCB_THEME, SAP_BELIZE_THEME];
					model.ui5Config = {
						Theme: SAP_BELIZE_THEME,
						AvailableThemes: BELIZE_AVAILABLE_THEMES
					};
				} else {
					var SAP_BLUECRYSTAL_THEME = "sap_bluecrystal";
					var BLUECRYSTAL_AVAILABLE_THEMES = [SAP_HCB_THEME, SAP_BLUECRYSTAL_THEME];
					model.ui5Config = {
						Theme: SAP_BLUECRYSTAL_THEME,
						AvailableThemes: BLUECRYSTAL_AVAILABLE_THEMES
					};
				}
			},

			_setMinUI5InModel: function (model) {
				var selectUI5Version = this._parseUIVersion2Float(model.selectedUI5Version);
				if (model.selectedUI5Version == null || model.selectedUI5Version.length === 0 || selectUI5Version >= this._MIN_UI5_VERSION.TO_SUPPORT_FIORI_3_THEME
					.val) {
					model.ui5Config.minUI5Version = this._MIN_UI5_VERSION.TO_SUPPORT_FIORI_3_THEME.str;
				} else if (selectUI5Version >= this._MIN_UI5_VERSION.TO_SUPPORT_UI5_V1_60_MODALIZATION.val) {
					model.ui5Config.minUI5Version = this._MIN_UI5_VERSION.TO_SUPPORT_UI5_V1_60_MODALIZATION.str;
				} else {
					model.ui5Config.minUI5Version = this._MIN_UI5_VERSION.TO_SUPPORT_CURRENT_TEMPLATE.str;
				}
			},

			onBeforeTemplateGenerate: function (templateZip, model) {
				shared.registerHandlebarHelpers();
				this._setThemeInModelBasedOnUI5Version(model);
				this._setMinUI5InModel(model);
				var selectUI5Version = this._parseUIVersion2Float(model.selectedUI5Version);
				model.isSAPUI5160Selected = (model.selectedUI5Version == null || model.selectedUI5Version.length === 0 || selectUI5Version >= this._MIN_UI5_VERSION
					.TO_SUPPORT_UI5_V1_60_MODALIZATION.val);
				model.sapUI5Url = "resources/sap-ui-core.js";
				
				templateZip.files["webapp/controller/Main.controller.js.tmpl"].name = "webapp/controller/Main.controller.js.tmpl";
				templateZip.files["webapp/controller/DataSelection.controller.js.tmpl"].name = "webapp/controller/DataSelection.controller.js.tmpl";
				templateZip.files["webapp/controller/Detail.controller.js.tmpl"].name = "webapp/controller/Detail.controller.js.tmpl";
				
				templateZip.files["webapp/view/Main.view.xml.tmpl"].name = "webapp/view/Main.view.xml.tmpl";
				templateZip.files["webapp/view/DataSelection.view.xml.tmpl"].name = "webapp/view/DataSelection.view.xml.tmpl";
				templateZip.files["webapp/view/Detail.view.xml.tmpl"].name = "webapp/view/Detail.view.xml.tmpl";
				
				return [templateZip, model];
			},

			onAfterGenerate: function (projectZip, model) {
				if (!sap.watt.getEnv("internal")) {
					// remove files which are only relevant for SAP-internal usage
					projectZip.remove("pom.xml");
				}
				this.addNeoDestinations(model);
				return [projectZip, model];
			//	return this.handleProjectSettingsForExternalProjects(model).then(function () {
				
			//	});
			},

		handleProjectSettingsForExternalProjects: function (model) {
				if (!sap.watt.getEnv("internal")) {
					//this part will only be executed for external builds
					var that = this,
						oBuildSettings = {
							"targetFolder": "dist",
							"sourceFolder": "webapp"
						},
						aProjectSettings = [
							"com.watt.common.builder.sapui5clientbuild"
						];

					return this.context.service.filesystem.documentProvider.getDocument("/" + model.projectName).then(function (oProjectDocument) {
						that.context.service.projectType.addProjectTypes(oProjectDocument, aProjectSettings).done();
						that.context.service.setting.project.setProjectSettings("build", oBuildSettings, oProjectDocument).done();
					});
				} else {
					return Q();
				}
			}, 

			addNeoDestinations: function (oModel) {
				var ui5Resource = {
					"path": "/resources",
					"target": {
						"type": "service",
						"name": "sapui5",
						"entryPath": "/resources"
					},
					"description": "SAPUI5 Resources"
				};
				var ui5TestResources = {
					"path": "/test-resources",
					"target": {
						"type": "service",
						"name": "sapui5",
						"entryPath": "/test-resources"
					},
					"description": "SAPUI5 Resources"
				};
				var localResources = {
					"path": "/webapp/resources",
					"target": {
						"type": "service",
						"name": "sapui5",
						"entryPath": "/resources"
					},
					"description": "SAPUI5 Resources"
				};
				var localTestResources = {
					"path": "/webapp/test-resources",
					"target": {
						"type": "service",
						"name": "sapui5",
						"entryPath": "/test-resources"
					},
					"description": "SAPUI5 Test Resources"
				};
				var destinations = [];

				if (!oModel.neoapp) {
					oModel.neoapp = {};
				}
				destinations.push(ui5Resource);
				destinations.push(ui5TestResources);
				destinations.push(localResources);
				destinations.push(localTestResources);
				oModel.neoapp.destinations = destinations;
			}
		};
	};
});