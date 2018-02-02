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

    var $ = require('jquery');
    var _ = require('underscore');
    var Epoxy = require('backbone-epoxy');
    var ItemDurationView = require('launches/common/ItemDurationView');
    var Util = require('util');
    var SingletonAppModel = require('model/SingletonAppModel');
    var Localization = require('localization');

    var ProductStatusLaunchNameView = Epoxy.View.extend({
        template: 'tpl-product-status-launch-name',
        className: 'product-status-launch-name',

        bindings: {
            '[data-js-name-link]': 'attr: {href: launchUrl}',
            '[data-js-name]': 'text: name',
            '[data-js-launch-number]': 'text: numberText'
        },
        computeds: {
            launchUrl: {
                deps: ['id'],
                get: function (id) {
                    return '#' + this.appModel.get('projectId') + '/launches/all/' + id;
                }
            }
        },

        initialize: function () {
            this.render();
            this.appModel = new SingletonAppModel();
            this.duration && this.duration.destroy();
            this.duration = new ItemDurationView({
                model: this.model,
                el: $('[data-js-item-status]', this.$el)
            });
        },
        render: function () {
            this.$el.html(Util.templates(this.template, {}));
        },
        onDestroy: function () {
            this.duration && this.duration.destroy();
        }
    });

    return ProductStatusLaunchNameView;
});
