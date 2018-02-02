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

define(function (require, exports, module) {
    'use strict';

    var $ = require('jquery');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Util = require('util');
    var App = require('app');
    var storageService = require('storageService');

    var DataMock = require('fakeData');
    var initialState = require('initialState');
    var Sidebar = require('sections/sidebar');

    $('body > #sandbox').remove();
    $('body').append('<div id="sandbox"></div>');

    describe('sidebar section tests', function () {

        var sandbox,
            sidebarView,
            activeHash = 'default_project/dashboard',
            project = "default_project",
            currentPage = "dashboard";

        var renderSidebar = function() {
            spyOn(Backbone.history, 'getFragment').and.returnValue(activeHash);
            sidebarView = new Sidebar({
                el: $('#sandbox > #pageSidebar.sidebar'),
                tpl: 'tpl-sidebar',
                projectUrl: project,
                currentPage: currentPage
            }).render();
        };

        beforeEach(function () {
            sandbox = $("#sandbox");
            sandbox.append('<section id="pageSidebar" class="sidebar"></section>');
            var userInfo = DataMock.getUserInfo();
            initialState.initAuthUser();
            var config = App.getInstance();
            config.userModel.set(DataMock.getConfigUser());
            config.userModel.ready.resolve();

        });

        afterEach(function () {
            sidebarView && sidebarView.destroy();
            sidebarView = null;
            sandbox.off().empty();
        });

        // it('should render sidebar view', function () {
        //     renderSidebar();
        //     expect(sidebarView).toBeDefined();
        //     expect($('#pageSidebar.sidebar', sandbox).length).toEqual(1);
        // });
        //
        // it('should contain main menu', function () {
        //     renderSidebar();
        //     expect($('.main-menu', sandbox).length).toEqual(1);
        // });
        //
        // it('should contain user menu', function () {
        //     renderSidebar();
        //     expect($('.user-menu', sandbox).length).toEqual(1);
        // });
        //
        // it('should destroy sidebar view', function () {
        //     renderSidebar();
        //     sidebarView.destroy();
        //     expect($('#pageSidebar.sidebar', sandbox).html()).toEqual('');
        // });
        //
        // it('should hide sidebar in mobile view', function () {
        //     spyOn(Sidebar.prototype, "closeMenu").and.callThrough();
        //     renderSidebar();
        //     spyOnEvent($('.main-menu a'), 'click');
        //     $('body').addClass('menu-open');
        //     $('.main-menu a', sandbox).first().trigger('click');
        //     expect('click').toHaveBeenTriggeredOn('.main-menu a');
        //     expect(Sidebar.prototype.closeMenu).toHaveBeenCalled();
        //     expect($('body').hasClass('menu-open')).toBeFalsy();
        // });
        //
        // it('should set last active page', function () {
        //     spyOn(Sidebar.prototype, "setLastActivePage").and.callThrough();
        //     renderSidebar();
        //     spyOnEvent($('[data-js-administrate-page-link]'), 'click');
        //     sidebarView.userStorage.set('lastActiveURL', null);
        //     $('[data-js-administrate-page-link]', sandbox).trigger('click');
        //     expect('click').toHaveBeenTriggeredOn('[data-js-administrate-page-link]');
        //     expect(Sidebar.prototype.setLastActivePage).toHaveBeenCalled();
        //     expect(sidebarView.userStorage.get('lastActiveURL')).toEqual('default_project/dashboard');
        // });
        //
        // it('should get last active page', function () {
        //     spyOn(Sidebar.prototype, "getLastActive").and.callThrough();
        //     spyOn(Sidebar.prototype, "setLastActivePage").and.callThrough();
        //     renderSidebar();
        //     sidebarView.setLastActivePage();
        //     expect(Sidebar.prototype.setLastActivePage).toHaveBeenCalled();
        //     var lastActivePage = sidebarView.getLastActive();
        //     expect(Sidebar.prototype.getLastActive).toHaveBeenCalled();
        //     expect(lastActivePage).toEqual('default_project/dashboard');
        // });
        //
        // it('should clear actives', function () {
        //     spyOn(Sidebar.prototype, "clearActives").and.callThrough();
        //     renderSidebar();
        //     $('.sidebar nav a',sandbox).addClass('active');
        //     sidebarView.clearActives();
        //     expect(Sidebar.prototype.clearActives).toHaveBeenCalled();
        //     expect($('.sidebar nav a.active',sandbox)).not.toExist();
        // });
        //
        // it('should update active link', function () {
        //     spyOn(Sidebar.prototype, "updateActiveLink").and.callThrough();
        //     spyOn(Sidebar.prototype, "clearActives").and.callThrough();
        //     renderSidebar();
        //     $('.sidebar nav a#launches',sandbox).addClass('active');
        //     sidebarView.updateActiveLink();
        //     expect(Sidebar.prototype.updateActiveLink).toHaveBeenCalled();
        //     expect($('.sidebar nav a#launches.active',sandbox)).not.toExist();
        //     expect($('.sidebar nav a.active',sandbox)).toEqual($('.sidebar nav a#dashboard',sandbox));
        // });
    });
});
