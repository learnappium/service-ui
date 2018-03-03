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

    var $ = require('jquery');
    var _ = require('underscore');
    var Epoxy = require('backbone-epoxy');
    var App = require('app');
    var RetriesLabelView = require('launches/common/retries/RetriesLabelView');
    var RetriesBlockView = require('launches/common/retries/RetriesBlockView');
    var config = App.getInstance();

    var CommonItemView = Epoxy.View.extend({
        afterChangeScrollTop: function () {
            this.elementOffsetTop = this.$el.offset().top;
        },
        changeScrollTop: function () {
            var currentOffsetTop = this.$el.offset().top;
            var currentScroll = config.mainScrollElement.scrollTop();
            config.mainScrollElement.scrollTop(currentScroll + (currentOffsetTop - this.elementOffsetTop));
        },
        onClickName: function () {
            config.trackingDispatcher.trackEventNumber(23);
            if (this.model.get('has_childs')) {
                this.model.trigger('drill:item', this.model);
            }
        },
        renderRetries: function () {
            this.retries && this.retries.destroy();
            this.retries = new RetriesLabelView({
                model: this.model,
                context: this.context
            });
            $('[data-js-retries-container]', this.$el).html(this.retries.$el);
            this.listenTo(this.retries, 'activate:retries', this.onActivateRetries);
        },
        onActivateRetries: function () {
            if (!this.retriesView) {
                this.retriesView = new RetriesBlockView({
                    model: this.model
                });
                $('[data-js-retries-block-container]', this.$el).html(this.retriesView.$el);
            }
            this.activateAccordion();
            this.$el.addClass('open');
            config.mainScrollElement.animate({ scrollTop: this.el.offsetTop + this.el.offsetHeight }, 500);
        }
    });

    return CommonItemView;
});
