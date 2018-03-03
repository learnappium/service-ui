/*
 * This file is part of Report Portal.
 *
 * Report Portal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Report Portal is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Report Portal.  If not, see <http://www.gnu.org/licenses/>.
 */
define(function (require) {
    'use strict';

    var Util = require('util');
    var $ = require('jquery');
    var Epoxy = require('backbone-epoxy');
    var DashboardListItemView = require('dashboard/DashboardListItemView');

    var ListView = Epoxy.View.extend({
        className: 'dashboard-list-view-list',
        template: 'tpl-dashboards-list',
        initialize: function (options) {
            this.search = options.search;
            this.collection.models = this.sortDashboardCollectionByASC(this.collection.models);
            this.render();
        },
        render: function () {
            this.$el.html(Util.templates(this.template, { search: this.search }));
            var self = this;
            _.each(this.collection.models, function (model) {
                var view = new DashboardListItemView({ model: model, blockTemplate: false });
                $('[data-js-dashboards-container]', self.$el).append(view.$el);
            });
            Util.hintValidator($('[data-js-filter-name]', this.$el), [{
                validator: 'minMaxNotRequired',
                type: 'dashboardName',
                min: 3,
                max: 128
            }]);
            if (!this.collection.models.length) $('[data-js-dashboard-not-found]', this.$el).addClass('rp-display-block');
        },

        sortDashboardCollectionByASC: function (collection) {
            return _.sortBy(collection, function (item) {
                return item.get('name').toUpperCase();
            });
        }

    });


    return ListView;
});
