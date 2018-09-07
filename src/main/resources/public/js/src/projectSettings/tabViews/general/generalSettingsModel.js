/*
 * Copyright 2016 EPAM Systems
 *
 *
 * This file is part of EPAM Report Portal.
 * https://github.com/epam/ReportPortal
 *
 * Report Portal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Report Portal is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Report Portal.  If not, see <http://www.gnu.org/licenses/>.
 */

define(function (require) {
    'use strict';

    var Backbone = require('backbone');
    var App = require('app');
    var config = App.getInstance();

    var GeneralSettingsModel = Backbone.Model.extend({

        defaults: {
            interruptedJob: config.forSettings.interruptedJob[0].value,
            keepLogs: config.forSettings.keepLogs[0].value,
            keepScreenshots: config.forSettings.keepScreenshots[0].value,
            projectSpecific: config.forSettings.projectSpecific[0].value,
        },

        getProjectSettings: function () {
            var data = {
                interruptedJob: this.get('interruptedJob'),
                keepLogs: this.get('keepLogs'),
                keepScreenshots: this.get('keepScreenshots'),
                projectSpecific: this.get('projectSpecific'),
            };
            return {
                configuration: data
            };
        }
    });

    return GeneralSettingsModel;
});
