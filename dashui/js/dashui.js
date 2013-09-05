/**
 *  DashUI
 *  https://github.com/hobbyquaker/dashui/
 *
 *  Copyright (c) 2013 hobbyquaker https://github.com/hobbyquaker
 *  MIT License (MIT)
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 *  documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
 *  rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 *  the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 *  THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 *  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 *  SOFTWARE.
 */

//console.log("DashUI");
// dui - the DashUI Engine



var dui = {

    version:            '0.9dev11',
    storageKeyViews:    'dashuiViews',
    storageKeySettings: 'dashuiSettings',
    storageKeyInstance: 'dashuiInstance',
    fileViews:          duiConfig.fileViews,
    instance:           null,
    urlParams:          {},
    settings:           {},
    views:              {},
    widgets:            {},
    activeView:         "",
    defaultHmInterval:  duiConfig.defaultHmInterval,
    listval:            [],
    widgetSets:         duiConfig.widgetSets,
    words:              null,
    currentLang:        duiConfig.currentLang,
    initialized:        false,
    useCache:           true,
    socket: {},
    binds: {},
    startInstance: function () {
        $("#dashui_instance").val(dui.instance);
        $("#create_instance").hide();
        $("#instance").show();

        var name = "dashui_"+dui.instance;

        dui.addStringVariable(name+"_view", "automatisch angelegt von DashUI.", function () {
            dui.addStringVariable(name+"_cmd", "automatisch angelegt von DashUI.", function () {
                dui.addStringVariable(name+"_data", "automatisch angelegt von DashUI.", function () {

                });
            });
        });

        /* TODO Instanzen
        $.homematic("addStringVariable", name+"_view", "automatisch angelegt von DashUI.")
        $.homematic("addStringVariable", name+"_cmd",  "automatisch angelegt von DashUI.")
        $.homematic("addStringVariable", name+"_data", "automatisch angelegt von DashUI.")

        $.homematic("addUiState", name+"_view");
        $.homematic("addUiState", name+"_cmd");
        $.homematic("addUiState", name+"_data");
         */


        $("body").append('<div class="dashui-dummy" data-hm-id="'+name+'_view"></div>')
            .append('<div class="dashui-dummy" data-hm-id="'+name+'_cmd"></div>')
            .append('<div class="dashui-dummy" data-hm-id="'+name+'_data"></div>');

        homematic.uiState.bind("change", function( e, attr, how, newVal, oldVal ) {

            // TODO auf IDs umbauen

            if (attr == ("_" + name + "_cmd.Value")) {
                var cmd = newVal;
                //console.log("change " + attr + " " + newVal);
                if (cmd !== "") {
                    setTimeout(function () {
                        var data = homematic.uiState.attr("_"+name+"_data.Value");

                        // external Commands
                       /* $.homematic("script",
                            "object o = dom.GetObject(\""+name+"_data\");\n" +
                                "o.State(\"\");\n" +
                                "o = dom.GetObject(\""+name+"_cmd\");\n" +
                                "o.State(\"\");"
                        );
                        switch (cmd) {
                            case "alert":
                                alert(data);
                                break;
                            case "changeView":
                                dui.changeView(data);
                                break;
                            case "refresh":
                                break;
                            case "reload":
                                setTimeout(function () {window.location.reload();}, 150);
                            case "dialog":
                                break;
                            case "popup":
                                window.open(data);
                                break;
                            default:
                        }*/
                    }, 50);
                }
            }
        });

    },
    removeInstance: function () {
        storage.set(dui.storageKeyInstance, null);
        var name = "dashui_"+dui.instance;
        // TODO
       /* $.homematic("delVariable", name + "_cmd",
            function () {
                $.homematic("delVariable", name + "_data",
                    function () {
                        $.homematic("delVariable", name + "_view", function() { window.location.reload(); });
                    }
                );
            }
        );*/


    },
    createInstance: function () {
        dui.instance = (Math.random() * 4294967296).toString(16);
        dui.instance = "0000000" + dui.instance;
        dui.instance = dui.instance.substr(-8);
        storage.set(dui.storageKeyInstance, dui.instance);
        dui.startInstance();
    },
    loadWidgetSet: function (name) {
        console.log("loadWidgetSet("+name+")");
        $.ajax({
            url: "widgets/"+name+".html",
            type: "get",
            async: false,
            dataType: "text",
            cache: dui.useCache,
            success: function (data) {
                jQuery("head").append(data);
            }
        });
    },
    loadWidgetSets: function () {
        for (var i = 0; i < dui.widgetSets.length; i++) {

            if (dui.widgetSets[i].name !== undefined) {
                dui.loadWidgetSet(dui.widgetSets[i].name);
                
                if (dui.urlParams['edit'] === "" && dui.widgetSets[i].edit) {
                    dui.loadWidgetSet(dui.widgetSets[i].edit);
                }
            } else {
                dui.loadWidgetSet(dui.widgetSets[i]);
            }
        }
    },
    initInstance: function () {
        dui.instance = storage.get(dui.storageKeyInstance);
        if (!dui.instance) {
            $("#instance").hide();
            return;
        } else {
            dui.startInstance();
        }
    },
    init: function () {
        if (this.initialized) {
            return;
        }


        dui.loadWidgetSets();

        $("#loading").append(" done.<br/>");
        dui.initInstance();
        
        var activeBkgClass = "";
        var settings = storage.get(dui.storageKeySettings);
        if (settings) {
            dui.settings = $.extend(dui.settings, settings);
        }

        // Late initialization (used only for debug)
        if (dui.binds.hqWidgetsExt) {
            dui.binds.hqWidgetsExt.hqInit ();
        }
            
        //dui.loadLocal();
        dui.loadRemote(dui.initNext);



    },
    initNext: function () {
        if (!dui.views) {
            dui.loadRemote(function() {
                $("#loading").html("").hide();
                // Erststart.
                dui.initViewObject();
            });
            return false;
        } else {
            $("#loading").html("").hide();
        }

        var hash = window.location.hash.substring(1);

        // View ausgewäfhlt?
        if (hash == "") {
            for (var view in dui.views) {
                dui.activeView = view;
                break;
            }

            if (dui.activeView == "") {
                alert("unexpected error - this should not happen :(")
                $.error("this should not happen :(");
            }
        } else {
            if (dui.views[hash]) {
                dui.activeView = hash;
            } else {
                alert("error - View doesn't exist :-(");
                window.location.href = "./edit.html";
                $.error("dui Error can't find view");
            }
        }

        $("#active_view").html(dui.activeView);

        dui.changeView(dui.activeView);

        // Set background style
        if (dui.views[dui.activeView] && dui.views[dui.activeView].settings != undefined && dui.views[dui.activeView].settings.style != undefined) {
            if (dui.views[dui.activeView].settings.style['background'] != undefined) {
                $("#duiview_"+dui.activeView).css("background", dui.views[dui.activeView].settings.style['background']);
            }
            if (dui.views[dui.activeView].settings.style['background_class'] != undefined) {
                activeBkgClass = dui.views[dui.activeView].settings.style['background_class'];
                $("#duiview_"+dui.activeView).addClass(activeBkgClass);
            }
        }

        // Navigation
        $(window).bind( 'hashchange', function(e) {
            dui.changeView(window.location.hash.slice(1));
        });
//console.log("EDIT??");

        // EDIT mode
        if (dui.urlParams["edit"] === "") {
            // DashUI Editor Init

            var sel;

            var keys = Object.keys(dui.views),
                i, k, len = keys.length;

            keys.sort();

            for (i = 0; i < len; i++) {
                k = keys[i];

                if (k == dui.activeView) {
                    $("#inspect_view").html(dui.activeView);
                    sel = " selected";
                } else {
                    sel = "";
                }
                $("#select_view").append("<option value='"+k+"'"+sel+">"+k+"</option>")
                $("#select_view_copy").append("<option value='"+k+"'"+sel+">"+k+"</option>")
            }
            $("#select_view").multiselect("refresh");
            $("#select_view_copy").multiselect("refresh");
            $("#select_view").change(function () {
                dui.changeView($(this).val());
            });

            $("#select_set").change(dui.refreshWidgetSelect);
            $("#select_set").html ("");

            for (i = 0; i < dui.widgetSets.length; i++) {
                if (dui.widgetSets[i].name !== undefined)
                    $("#select_set").append("<option value='"+dui.widgetSets[i].name+"'>"+dui.widgetSets[i].name+"</option>");
                else
                    $("#select_set").append("<option value='"+dui.widgetSets[i]+"'>"+dui.widgetSets[i]+"</option>");
            }
            $("#select_set").multiselect("refresh");
            dui.refreshWidgetSelect();


            //console.log("TOOLBOX OPEN");
            $("#dui_editor").dialog("open");
            dui.binds.jqueryui._disable();

            // Create background_class property if does not exist
            if (dui.views[dui.activeView] != undefined) {
                if (dui.views[dui.activeView].settings == undefined) {
                    dui.views[dui.activeView].settings = new Object ();
                }
                if (dui.views[dui.activeView].settings.style == undefined) {
                    dui.views[dui.activeView].settings.style = new Object ();
                }
                if (dui.views[dui.activeView].settings.style['background_class'] == undefined) {
                    dui.views[dui.activeView].settings.style['background_class'] = "";
                }
            }


            // Init background selector
            hqStyleSelector.Show ({ width: 202,
                            name:       "inspect_view_bkg_def",
                            filterFile: "backgrounds.css",
                            style:      activeBkgClass,     
                            parent:     $('#inspect_view_bkg_parent'),
							onchange:   function (newStyle, obj) {
                                if (dui.views[dui.activeView].settings.style['background_class'])
                                    $("#duiview_"+dui.activeView).removeClass(dui.views[dui.activeView].settings.style['background_class']);
								dui.views[dui.activeView].settings.style['background_class'] = newStyle;
								$("#duiview_"+dui.activeView).addClass(dui.views[dui.activeView].settings.style['background_class']);
							},
                          });
            
        }
        this.initialized = true;
    },
    refreshWidgetSelect: function () {
        $("#select_tpl").html("");
        var current_set = $("#select_set option:selected").val();
        $(".dashui-tpl[data-dashui-set='"+current_set+"']").each(function () {
            $("#select_tpl").append("<option value='"+$(this).attr("id")+"'>"+$(this).attr("data-dashui-name")+"</option>")
        });
        $("#select_tpl").multiselect("refresh");
    },
    initViewObject: function () {
        dui.views = {view1:{settings:{style:{}},widgets:{}}};
        dui.saveRemote();
        window.location.href='./?edit';
    },
    renderView: function (view) {
        console.log("renderView("+view+")");

        //console.log(dui.views[view].settings.style);
        if (!dui.views[view].settings.theme) {
            dui.views[view].settings.theme = "dhive";
        }
        if (!dui.views[view].settings.interval) {
            dui.views[view].settings.interval = dui.defaultHmInterval;
        }
        $("#jqui_theme").attr("href", "css/"+dui.views[view].settings.theme+"/jquery-ui.min.css");
        if ($("#dui_container").find("#duiview_"+view).html() == undefined) {
            $("#dui_container").append("<div id='duiview_"+view+"' class='dashui-view'></div>");
            $("#duiview_"+view).css(dui.views[view].settings.style);


            for (var id in dui.views[view].widgets) {
                dui.renderWidget(view, id);
            }


            if (dui.activeView != view) {
                $("#duiview_"+view).hide();
            }

            if (dui.urlParams["edit"] === "") {
                dui.binds.jqueryui._disable();
            }

        } else {
            console.log("View already rendered - nothing to do");
        }

        // Views in Container verschieben
        $("#duiview_"+view).find("div[id$='container']").each(function () {
            console.log($(this).attr("id")+ " contains " + $(this).attr("data-dashui-contains"));
            var cview = $(this).attr("data-dashui-contains")
            if (!dui.views[cview]) {
                $(this).append("error: view not found.");
                return false;
            } else if (cview == view) {
                $(this).append("error: view container recursion.");
                return false;
            }
            dui.renderView(cview);
            $("#duiview_"+cview).appendTo(this).show();

        });

    },
    preloadImages: function (srcs) {
        if (!dui.preloadImages.cache) {
            dui.preloadImages.cache = [];
        }
        var img;
        for (var i = 0; i < srcs.length; i++) {
            img = new Image();
            img.src = srcs[i];
            dui.preloadImages.cache.push(img);
        }
    },
    reRenderWidget: function (widget) {
        $("#"+widget).remove();
        dui.renderWidget(dui.activeView, widget);
    },
    renderWidget: function (view, id) {
        var widget = dui.views[view].widgets[id];
        
        //console.log("renderWidget("+view+","+id+")");
        // Add to the global array of widgets
        dui.widgets[id] = {
            wid: id,
            data: new can.Observe($.extend({
                "wid": id
            }, widget.data))
        };
        //console.log(widget);
        // Register hm_id to detect changes
       // if (widget.data.hm_id != 65535)
         //   $.homematic("addUiState", widget.data.hm_id, widget.data.hm_wid);
        
        var widgetData = dui.widgets[id]["data"];
        widgetData.hm_id = widgetData.hm_id; //$.homematic("escape", widgetData.hm_id);
        
        // Append html element to view
        $("#duiview_"+view).append(can.view(widget.tpl, {hm: homematic.uiState["_"+widget.data.hm_id], data: widgetData, view: view}));
       

        if (widget.style) {
            $("#"+id).css(widget.style);
        }
        
        // If edit mode, bind on click event to open this widget in edit dialog
        if (dui.urlParams["edit"] === "") {
            $("#"+id).click(function (e) {
                dui.inspectWidget(id);
                e.preventDefault();
                return false;
            });
        }
    },
    changeView: function (view, hideOptions, showOptions) {
        console.log("changeView("+view+","+hideOptions+","+showOptions+")");
        var effect = (hideOptions && hideOptions.effect && hideOptions.effect !== "" ? true : false);
        hideOptions = $.extend(true, {effect:undefined,options:{},duration:0}, hideOptions);
        showOptions = $.extend(true, {effect:undefined,options:{},duration:0}, showOptions);


        //console.log("changeView("+view+")");
        if (dui.inspectWidget) {
            dui.inspectWidget("none");
            dui.clearWidgetHelper();
            //$("#duiview_"+dui.activeView).hide();
            $("#select_active_widget").html("<option value='none'>none selected</option>");
            //console.log($("#select_active_widget").html());
        }

        if (!dui.views[view]) {
            for (var prop in dui.views) {
                // object[prop]
                break;
            }
            view = prop;
        }

        dui.renderView(view);

        // View ggf aus Container heraus holen
        if ($("#duiview_"+view).parent().attr("id") !== "dui_container") {
            $("#duiview_"+view).appendTo("#dui_container");
        }


        if (dui.activeView !== view) {

            if (effect) {
                console.log("hideoptions..."); console.log(hideOptions);
                $("#duiview_"+dui.activeView).hide(hideOptions.effect, hideOptions.options, hideOptions.duration, function () {
                    console.log("show");
                    $("#jqui_theme").attr("href", "css/"+dui.views[view].settings.theme+"/jquery-ui.min.css");
                    $("#duiview_"+view).show(showOptions.effect, showOptions.options, showOptions.duration, function () {
                        console.log("show done");
                    });
                    console.log("hide done");
                });
            } else {
                $("#duiview_"+dui.activeView).hide();
                console.log("hide "+dui.activeView);
                $("#jqui_theme").attr("href", "css/"+dui.views[view].settings.theme+"/jquery-ui.min.css");
                $("#duiview_"+view).show();
                console.log("show "+view);
            }




        }

        //console.log("changeView("+view+")");
        dui.activeView = view;

        $("#duiview_"+view).find("div[id$='container']").each(function () {
            console.log($(this).attr("id")+ " contains " + $(this).attr("data-dashui-contains"));
            var cview = $(this).attr("data-dashui-contains");
            jQuery("duiview_"+cview).show();
        });

                /*
                        if (dui.views[view].settings.interval) {
                            //console.log("setInterval "+dui.views[view].settings.interval);
                           $.homematic("setInterval", dui.views[view].settings.interval);
                        }
                */
        if (dui.instance) {
            // TODO aktuelle View in Instanz-Variable schreiben
          //   $.homematic("script", "object o = dom.GetObject('dashui_"+dui.instance+"_view');\no.State('"+dui.activeView+"');");
        }

        if (window.location.hash.slice(1) != view) {
            history.pushState({}, "", "#" + view);
        }

        // Navigation-Widgets

        $(".jqui-nav-state").each(function () {
            var $this = $(this);
            if ($this.attr("data-dashui-nav") == view) {
                $this.removeClass("ui-state-default")
                $this.addClass("ui-state-active");
            } else {
                $this.addClass("ui-state-default")
                $this.removeClass("ui-state-active");
            }
        });




        // Editor
        $("#inspect_view").html(view);

        $("#select_active_widget").html("<option value='none'>none selected</option>");
        for (var widget in dui.views[dui.activeView].widgets) {
            var obj = $("#"+dui.views[dui.activeView].widgets[widget].tpl);
            $("#select_active_widget").append("<option value='"+widget+"'>"+widget+" ("+obj.attr("data-dashui-set")+ " " +obj.attr("data-dashui-name")+")</option>");
        }
        //console.log($("#select_active_widget").html());
        $("#select_active_widget").multiselect("refresh");


        if ($("#select_view option:selected").val() != view) {
            $("#select_view option").removeAttr("selected");
            $("#select_view option[value='"+view+"']").prop("selected", "selected");
            $("#select_view").multiselect("refresh");
        }
        $("#select_view_copy option").removeAttr("selected");
        $("#select_view_copy option[value='"+view+"']").prop("selected", "selected");
        $("#select_view_copy").multiselect("refresh");
        $(".dashui-inspect-view-css").each(function () {
            var $this = $(this);
            var attr = $this.attr("id").slice(17);
            $("#"+$this.attr("id")).val(dui.views[dui.activeView].settings.style[attr]);
        });
        $(".dashui-inspect-view").each(function () {
            var $this = $(this);
            var attr = $this.attr("id").slice(13);
            $("#"+$this.attr("id")).val(dui.views[dui.activeView].settings[attr]);
        });
        if (!dui.views[dui.activeView].settings["theme"]) {
            dui.views[dui.activeView].settings["theme"] = "dhive";
        }
        $("#inspect_view_theme option[value='"+dui.views[dui.activeView].settings.theme+"']").prop("selected", true);
        $("#inspect_view_theme").multiselect("refresh");




        //console.log("activeView="+dui.activeView);
        return;


    },
    addView: function (view) {
        if (dui[view]) {
            return false;
        }
        dui.views[view] = {settings:{style:{}},widgets:{}};
        dui.saveRemote();
        dui.changeView(view);
        window.location.reload();
    },
    loadRemote: function (callback) {
        $("#loading").append("Please wait! Trying to load views from CCU.IO");
        dui.socket.emit("readFile", "dashui-views.json", function (data) {
            dui.views = data;
            if (!dui.views) {
                alert("No Views found on CCU.IO");
            }
            callback();
        });

    },
    saveRemote: function () {
        dui.socket.emit("writeFile", "dashui-views.json", dui.views, function () {
            console.log("Saved views on CCU.IO");
        });
    }
};


var homematic = {
    uiState: new can.Observe({"_65535":{"Value":null}}),
    setState: new can.Observe({"_65535":{"Value":null}}),
    regaIndex: {},
    regaObjects: {},
    setStateTimers: {},
    setValue: function (id, val) {
        console.log("setValue("+id+","+val+")");

        this.setState.attr("_"+id, {Value:val});
        var d = new Date();
        var t = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
        var o = {};
        o["_"+id+".Value"]     = val;
        o["_"+id+".Timestamp"] = t;
        o["_"+id+".Certain"]   = false;
        this.uiState.attr(o);
    },
    stateDelayed: function (attr, val) {
        var id = parseInt(attr.slice(1), 10);
        if (!this.setStateTimers[id]) {

            dui.socket.emit("setState", [id, val]);

            this.setState.removeAttr(attr);
            this.setStateTimers[id] = setTimeout(function () {
                if (homematic.setState[attr]) {
                    homematic.setStateTimers[id] = undefined;
                    homematic.stateDelayed(id, homematic.setState.attr(attr + ".Value"));
                }
                homematic.setStateTimers[id] = undefined;
            }, 1000);
        }
    }
}

homematic.setState.bind("change", function (e, attr, how, newVal, oldVal) {
    console.log("homematic setState change "+how+" "+attr+" "+newVal);
    if (how == "set" || how == "add") {
        homematic.stateDelayed(attr, newVal.Value);
    }
});


// Parse Querystring
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);
    dui.urlParams = {};
    while (match = search.exec(query)) {
        dui.urlParams[decode(match[1])] = decode(match[2]);
    }
    // if old edit type
    if (dui.urlParams['edit'] === "") {
        window.location.href = "./edit.html" + window.location.hash;
    }
    if (window.location.href.indexOf("edit.html") != -1) {
        dui.urlParams['edit'] = "";
    }
})();

(function($) {
    $(document).ready(function() {
        // für iOS Safari - wirklich notwendig?
        $('body').on('touchmove', function (e) {
            if ($(e.target).closest("body").length == 0) {
                e.preventDefault();
            }
        });

        $(".dashui-version").html(dui.version);

        // Autorefresh nur wenn wir nicht im Edit-Modus sind
        var autoRefresh = dui.urlParams["edit"] !== "";
        if (!autoRefresh && dui.editInit) {
            dui.editInit ();
        }
        

        console.log("socket.io")
        $("#loading").append("Connecting Socket.IO ...<br/>");

        dui.socket = io.connect( $(location).attr('protocol') + '//' +  $(location).attr('host'));
        dui.socket.on('event', function(obj) {
            console.log("event! "+JSON.stringify(obj));
            if (homematic.uiState["_"+obj[0]] !== undefined) {
                var o = {};
                // Check if value changed
                if (obj[3]) {
                    if (o["_"+obj[0]+".Value"] != obj[1]) {
                        var d = new Date();
                        var t = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();
                        o["_"+obj[0]+".LastChange"] = t;
                    }
                }
                o["_"+obj[0]+".Value"]     = obj[1];
                o["_"+obj[0]+".Timestamp"] = obj[2];
                o["_"+obj[0]+".Certain"]   = obj[3];            
                homematic.uiState.attr(o);
                
                // Ich habe keine Ahnung, aber bind("change") funktioniert einfach nicht 
                if (dui.binds.hqWidgetsExt && dui.binds.hqWidgetsExt.hqMonitor && obj[3])
                    dui.binds.hqWidgetsExt.hqMonitor (obj[0], obj[1], homematic.uiState["_"+obj[0]]["LastChange"]);
            }
            else {
                console.log("Datenpunkte sind noch nicht geladen!");
            }
        });

        $("#loading").append("Loading ReGa Data");

        dui.socket.emit("getIndex", function (index) {
            $("#loading").append(".");
            console.log("index loaded");
                homematic.regaIndex = index;
                dui.socket.emit("getObjects", function (obj) {
                    $("#loading").append(".");
                    console.log("objects loaded")
                    homematic.regaObjects = obj;
                    dui.socket.emit("getDatapoints", function (data) {
                        $("#loading").append(".<br/>");
                        console.log("datapoints loaded");
                        for (var dp in data) {
                            homematic.uiState.attr("_"+dp, { Value: data[dp][0], Timestamp: data[dp][1]});
                        }
                        $("#loading").append("Loading Widget-Sets...");
                        setTimeout(dui.init, 10);

                    });
                });
            });


    });


})(jQuery);