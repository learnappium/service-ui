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
    var Util = require('util');
    var C3ChartWidgetView = require('newWidgets/_C3ChartWidgetView');
    var SingletonDefectTypeCollection = require('defectType/SingletonDefectTypeCollection');
    var SingletonLaunchFilterCollection = require('filters/SingletonLaunchFilterCollection');
    var Localization = require('localization');
    var d3 = require('d3');
    var c3 = require('c3');
    var App = require('app');

    var config = App.getInstance();


    var OverallStatisticsWidget = C3ChartWidgetView.extend({
        templateDonut: 'tpl-widget-overall-statistics-donut',
        templatePanel: 'tpl-widget-overall-statistics-trend',
        templatePanelItem: 'tpl-widget-overall-statistics-trend-item',
        className: 'overall-statistics',

        render: function () {
            var widgetOptions;
            var contentData;
            var statusChartData;
            var defectTypesChartData;
            var defectTypesChartDataOrdered = {};

            if (this.isPreview) {
                this.$el.addClass('preview-view');
            }

            if (!this.isDataExists()) {
                this.addNoAvailableBock();
                return;
            }
            this.charts = [];
            this.scrollers = [];
            widgetOptions = this.model.getParameters().widgetOptions;
            contentData = this.model.getContent().result[0].values;
            statusChartData = _.pick(contentData, ['statistics$executions$passed', 'statistics$executions$failed', 'statistics$executions$skipped', 'statistics$executions$total']);
            defectTypesChartData = _.omit(contentData, ['statistics$executions$failed', 'statistics$executions$passed', 'statistics$executions$skipped', 'statistics$executions$total']);

            _.each(this.model.getContentFields(), function (field) {
                _.each(defectTypesChartData, function (val, key) {
                    if (key === field) {
                        defectTypesChartDataOrdered[key] = val;
                    }
                });
            });
            if (contentData.statistics$executions$total === 0 || (_.isEmpty(defectTypesChartDataOrdered) && _.isEmpty(statusChartData))) {
                this.addNoAvailableBock();
                return;
            }
            this.defetTypesCollection = new SingletonDefectTypeCollection();
            this.launchFilterCollection = new SingletonLaunchFilterCollection();
            this.defetTypesCollection.ready.done(function () {
                this.launchFilterCollection.ready.done(function () {
                    if (this.isDrawDonut(widgetOptions)) {
                        this.$el.html(Util.templates(this.templateDonut, {}));
                        this.$el.addClass('donut-chart-view');
                        if (_.isEmpty(statusChartData)) {
                            this.$el.addClass('left-chart-hidden');
                        }
                        if (_.isEmpty(defectTypesChartDataOrdered)) {
                            this.$el.addClass('right-chart-hidden');
                        }
                        if (!_.isEmpty(statusChartData)) {
                            $('[data-js-left-chart-container]', this.$el).addClass('status-chart');
                            this.drawDonutChart($('[data-js-left-chart-container]', this.$el), statusChartData);
                        }
                        if (!_.isEmpty(defectTypesChartDataOrdered)) {
                            $('[data-js-right-chart-container]', this.$el).addClass('issues-chart');
                            this.drawDonutChart($('[data-js-right-chart-container]', this.$el), defectTypesChartDataOrdered);
                        }
                        this.restyleDonutTitle();
                    } else {
                        this.$el.html(Util.templates(this.templatePanel, {}));
                        this.$el.addClass('trend-chart-view');
                        if (!_.isEmpty(statusChartData)) {
                            this.drawStackedBarChart($('[data-js-left-chart-container]', this.$el), statusChartData);
                        } else {
                            this.$el.addClass('left-chart-hidden');
                        }
                        if (!_.isEmpty(defectTypesChartDataOrdered)) {
                            this.drawDefectTypesPanel($('[data-js-right-chart-container]', this.$el), defectTypesChartDataOrdered);
                        } else {
                            this.$el.addClass('right-chart-hidden');
                        }
                    }
                }.bind(this));
            }.bind(this));
        },

        drawDonutChart: function ($el, data) {
            var self = this;
            var chart;
            var chartData = [];
            var itemNames = [];
            var colors = {};
            var total = 0;
            var donutTitle = '';
            var legendScroller;

            _.each(data, function (val, key) {
                var defectModel;
                var locator = key.split('$')[key.split('$').length - 1];
                if (key === 'statistics$executions$total') {
                    return;
                }
                if (~['statistics$executions$passed', 'statistics$executions$failed', 'statistics$executions$skipped'].indexOf(key)) {
                    colors[key] = config.defaultColors[locator];
                } else {
                    defectModel = _.find(this.defetTypesCollection.models, function (model) {
                        return model.get('locator') === locator;
                    });
                    defectModel && (colors[key] = defectModel.get('color'));
                }
                total += +val;
                itemNames.push(key);
                chartData.push([key, +val]);
            }.bind(this));
            chart = c3.generate({
                bindto: $el[0],
                data: {
                    columns: chartData,
                    type: 'donut',
                    onclick: function (d, element) {
                        var url;
                        var filterModel = self.launchFilterCollection.get(self.model.get('filter_id'));
                        if (filterModel) {
                            url = '#' + self.appModel.get('projectId') + '/launches/' + filterModel.get('id');
                        } else {
                            url = '#' + self.appModel.get('projectId') + '/launches/all';
                        }
                        config.router.navigate(url, { trigger: true });
                    },
                    order: null,
                    colors: colors
                },
                interaction: {
                    enabled: !self.isPreview
                },
                padding: {
                    top: self.isPreview ? 0 : 85
                },
                legend: {
                    show: false // we use custom legend
                },
                donut: {
                    title: total,
                    label: {
                        show: false,
                        threshold: 0.05
                    }
                },
                tooltip: {
                    position: function (d, width, height, element) {
                        var left = d3.mouse(chart.element)[0] - (width / 2);
                        var top = d3.mouse(chart.element)[1] - height;
                        return {
                            top: top - 8, // 8 - offset for tooltip arrow
                            left: left
                        };
                    },
                    contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
                        var name;
                        var defectModel;
                        var locator = d[0].id.split('$')[d[0].id.split('$').length - 1];
                        if (~['statistics$executions$passed', 'statistics$executions$failed', 'statistics$executions$skipped'].indexOf(d[0].id)) {
                            name = Localization.launchesHeaders[locator].toUpperCase();
                        } else {
                            defectModel = self.defetTypesCollection.getDefectByLocator(locator);
                            if (defectModel) {
                                name = defectModel.get('longName');
                            } else {
                                return '<div class="tooltip-title-invalid">' +
                                    '<div class="color-mark-invalid"></div>' +
                                    locator +
                                    '</div>';
                            }
                        }
                        return '<div class="tooltip-val">' + d[0].value + ' (' + self.getRoundedToDecimalPlaces(d[0].ratio * 100, 2).toFixed(2) + '%)</div>' +
                            '<div class="tooltip-title">' +
                                '<div class="color-mark" style="background-color: ' + color(d[0].id) + ';"></div>' +
                                 name +
                            '</div>';
                    }
                },
                onrendered: function () {
                    $el.css('max-height', 'none');
                    if (chart) {
                        total = 0;
                        _.each(chart.data.shown(), function (dataItem) {
                            total += dataItem.values[0].value;
                        });
                    }
                    self.restyleDonutTitle();
                    $('.c3-chart-arcs-title', $el).contents()[0].textContent = total;
                }
            });
            this.charts.push(chart);

            // Configuring custom legend block
            if (!self.isPreview) {
                d3.select(chart.element)
                .insert('div', '.chart')
                .attr('class', 'legend')
                .insert('div', '.legend')
                .attr('data-js-legend-wrapper', '') // wrapper for BaronScroll
                .selectAll('span')
                .data(itemNames)
                .enter()
                .append('span')
                .attr('data-id', function (id) { return id; })
                .html(function (id) {
                    var name;
                    var defectModel;
                    var locator = id.split('$')[id.split('$').length - 1];
                    if (~['statistics$executions$passed', 'statistics$executions$failed', 'statistics$executions$skipped'].indexOf(id)) {
                        name = Localization.launchesHeaders[locator];
                    } else {
                        defectModel = self.defetTypesCollection.getDefectByLocator(locator);
                        if (defectModel) {
                            name = defectModel.get('longName');
                        } else {
                            return '<div class="invalid-color-mark"></div><span class="invalid">' + locator + '</span>';
                        }
                    }
                    return '<div class="color-mark"></div>' + name;
                })
                .each(function (id) {
                    if (~self.hiddenItems.indexOf(id)) {
                        $('.color-mark', $(this)).addClass('unchecked');
                    }
                    d3.select(this).select('.color-mark').style('background-color', chart.color(id));
                })
                .on('mouseover', function (id) {
                    chart.focus(id);
                })
                .on('mouseout', function (id) {
                    chart.revert();
                })
                .on('click', function (id) {
                    config.trackingDispatcher.trackEventNumber(342);
                    $('.color-mark', $(this)).toggleClass('unchecked');
                    chart.toggle(id);
                });
                this.hiddenItems && chart.hide(this.hiddenItems);
                d3.select(chart.element).select('.legend')
                .append('div')
                .attr('class', 'legend-gradient')
                .append('div')
                .attr('class', 'legend-border');
                legendScroller = Util.setupBaronScroll($('[data-js-legend-wrapper]', $el));
                this.scrollers.push(legendScroller);
            }

            // Configuring custom donut chart title
            if ($el.hasClass('status-chart')) {
                donutTitle = Localization.widgets.pieSum;
            } else if ($el.hasClass('issues-chart')) {
                donutTitle = Localization.widgets.pieIssues;
            }
            d3.select(chart.element).select('.c3-chart-arcs-title').attr('dy', -5)
                .append('tspan')
                .attr('dy', 16)
                .attr('x', 0)
                .text(donutTitle);
        },
        drawStackedBarChart: function ($el, data) {
            var legendScroller;
            if (data.statistics$executions$total) {
                $('[data-js-total-value]', $el).html(data.statistics$executions$total);
            } else {
                $('[data-js-total]', $el).add($('[data-js-bar]', $el)).addClass('hidden');
            }
            if (!data.statistics$executions$passed && !data.statistics$executions$failed && !data.statistics$executions$skipped) {
                $('[data-js-bar]', $el).addClass('hidden');
            }
            (data.statistics$executions$passed) ? $('[data-js-legend-passed-val]', $el).html(data.statistics$executions$passed) : $('[data-js-legend-passed]', $el).addClass('hidden');
            (data.statistics$executions$failed) ? $('[data-js-legend-failed-val]', $el).html(data.statistics$executions$failed) : $('[data-js-legend-failed]', $el).addClass('hidden');
            (data.statistics$executions$skipped) ? $('[data-js-legend-skipped-val]', $el).html(data.statistics$executions$skipped) : $('[data-js-legend-skipped]', $el).addClass('hidden');

            $('[data-js-bar-passed]', $el).width(((data.statistics$executions$passed / data.statistics$executions$total) * 100) + '%');
            $('[data-js-bar-failed]', $el).width(((data.statistics$executions$failed / data.statistics$executions$total) * 100) + '%');
            $('[data-js-bar-skipped]', $el).width(((data.statistics$executions$skipped / data.statistics$executions$total) * 100) + '%');
            legendScroller = Util.setupBaronScroll($el);
            this.scrollers.push(legendScroller);
        },
        drawDefectTypesPanel: function ($el, data) {
            var legendScroller;
            var $fragment = $(document.createDocumentFragment());
            _.each(data, function (val, title) {
                var locator = title.split('$')[title.split('$').length - 1];
                var color = _.find(this.defetTypesCollection.models, function (model) {
                    return model.get('locator') === locator;
                }).get('color');
                $fragment.append(Util.templates(
                    this.templatePanelItem, {
                        val: val,
                        title: this.defetTypesCollection.getDefectByLocator(locator).get('longName'),
                        color: color
                    }
                ));
            }.bind(this));
            $el.html($fragment);
            legendScroller = Util.setupBaronScroll($el);
            this.scrollers.push(legendScroller);
        },
        restyleDonutTitle: function () {
            if (!(this.$el.hasClass('w-less-then-6') || this.$el.hasClass('h-less-then-6') || this.$el.hasClass('preview-view'))) {
                $('.c3-chart-arcs-title', this.$el).attr('dy', '-10').find('tspan').attr('dy', '30');
            } else {
                $('.c3-chart-arcs-title', this.$el).attr('dy', '-5').find('tspan').attr('dy', '15');
            }
        },
        isDrawDonut: function (widgetOptions) {
            return (widgetOptions && widgetOptions.viewMode && widgetOptions.viewMode.length && widgetOptions.viewMode[0] === 'donut');
        },
        onBeforeDestroy: function () {
            _.each(this.scrollers, function (baronScrollElem) {
                baronScrollElem.baron && baronScrollElem.baron().dispose();
            });
        }
    });

    return OverallStatisticsWidget;
});
