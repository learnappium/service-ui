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

    var Epoxy = require('backbone-epoxy');
    var Util = require('util');
    var App = require('app');

    var config = App.getInstance();

    var InvalidPage = Epoxy.View.extend({
        tpl: 'tpl-invalid-page',
        className: 'invalid-page',
        events: {
            'click [data-js-back-home]': 'onClickHome'
        },

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(Util.templates(this.tpl));
            config.userModel.set({ lastInsideHash: config.userModel.getDefaultProjectHash() });
            return this;
        },
        onClickHome: function () {
            config.router.navigate(config.userModel.getDefaultProjectHash(), { trigger: true });
        },
        onDestroy: function () {
            this.remove();
        }
    });

    return InvalidPage;
});
