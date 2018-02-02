/*
 * Copyright 2016 EPAM Systems
 *
 *
 * This file is part of EPAM Report Portal.
 * https://github.com/reportportal/service-ui
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

    var Epoxy = require('backbone-epoxy');
    var Util = require('util');

    var ProjectEventModel = Epoxy.Model.extend({
        defaults: {
            actionType: 'all',
            activityId: '',
            history: {},
            lastModifiedDate: 0,
            objectType: 'all',
            objectName: '',
            projectRef: '',
            userRef: '',
            loggedObjectRef: ''
        },
        computeds: {
            lastModifiedDateFormat: {
                deps: ['lastModifiedDate'],
                get: function (lastModifiedDate) {
                    return Util.dateFormat(lastModifiedDate);
                }
            },
            lastModifiedDateFromNow: {
                deps: ['lastModifiedDate'],
                get: function (lastModifiedDate) {
                    return Util.fromNowFormat(lastModifiedDate);
                }
            }
        },
        initialize: function () {
        }
    });

    return ProjectEventModel;
});
