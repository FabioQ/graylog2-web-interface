$(document).ready(function() {

    $("div.xtrc-select-message").sampleMessageLoader({
        subcontainer: $('div.subcontainer', $('div.xtrc-select-message')),
        selector: $('div.manual-selector', $('div.xtrc-select-message')),
        message: $('div.xtrc-message', $('div.xtrc-select-message')),
        spinner: $('div.spinner', $('div.xtrc-select-message')),
        recentButton: $('button.xtrc-load-recent', $('div.subcontainer', $('div.xtrc-select-message'))),
        selectorButton: $('button.xtrc-load-manual', $('div.subcontainer', $('div.xtrc-select-message')))
    });

    $("div.xtrc-message").on("click", "dt.xtrc-message-field", function() {
        var field = $(this).attr("data-field");
        var value = $(this).attr("data-value");

        $(".xtrc-select-message").remove();

        var wizard = $(".xtrc-wizard");
        $(".xtrc-wizard-field", wizard).html(field)
        $(".xtrc-wizard-example", wizard).html(value);

        $("input[name=field]", wizard).val(field)
        $("input[name=example]", wizard).val(value);
        wizard.show();
    });

    // Try regular expression against example.
    $(".xtrc-try-regex").on("click", function() {
        var button = $(this);

        button.html("<i class='icon-refresh icon-spin'></i> Trying...");
        $.ajax({
            url: appPrefixed('/a/tools/regex_test'),
            data: {
                "string":$("#xtrc-example").text(),
                "regex":$("#regex_value").val()
            },
            success: function(matchResult) {
                if(matchResult.finds) {
                    highlightMatchResult(matchResult);
                } else {
                    showWarning("Regular expression did not match.");
                }
            },
            error: function() {
                showError("Could not try regular expression. Make sure that it is valid.");
            },
            complete: function() {
                button.html("Try!");
            }
        });
    });

    function trySubstring(e) {
        var button = e;

        var warningText = "We were not able to run the substring extraction. Please check index boundaries.";

        var beginIndex = $("#begin_index").val();
        var endIndex = $("#end_index").val();

        if (parseInt(beginIndex) == parseInt(endIndex)) {
            highlightMatchResult({"match": {"start":parseInt(beginIndex), "end":parseInt(endIndex)}});
            return;
        }

        button.html("<i class='icon-refresh icon-spin'></i> Trying...");
        $.ajax({
            url: appPrefixed('/a/tools/substring_test'),
            data: {
                "string":$("#xtrc-example").text(),
                "start":beginIndex,
                "end":endIndex
            },
            success: function(result) {
                if(result.successful) {
                    highlightMatchResult(result);
                } else {
                    showWarning(warningText);
                }
            },
            error: function() {
                showError(warningText);
            },
            complete: function() {
                button.html("Try!");
            }
        });
    }

    $("#begin_index").on("change", function(e) {
        var elem = $("#begin_index");
        var endIndex = $("#end_index");

        if (parseInt(elem.val()) < 0) {
            elem.val(0);
        }
        if (parseInt(elem.val()) > parseInt(endIndex.val())) {
            elem.val(endIndex.val());
        }
        trySubstring($(".xtrc-try-substring"));
    });

    $("#end_index").on("change", function(e) {
        var elem = $("#end_index");
        var maxLength = $("#xtrc-example").text().length;
        var beginIndex = $("#begin_index").val();

        if (parseInt(elem.val()) > maxLength) {
            elem.val(maxLength);
        }
        if (parseInt(beginIndex) > parseInt(elem.val())) {
            elem.val(beginIndex);
        }
        trySubstring($(".xtrc-try-substring"));
    });

    // Try substring against example.
    $(".xtrc-try-substring").on("click", function() {
        trySubstring($(this));
    });

    // Try split&index against example.
    $(".xtrc-try-splitandindex").on("click", function() {
        var button = $(this);

        var warningText = "We were not able to run the split&index extraction. Please check your parameters.";

        button.html("<i class='icon-refresh icon-spin'></i> Trying...");
        $.ajax({
            url: appPrefixed('/a/tools/split_and_index_test'),
            data: {
                "string":$("#xtrc-example").text(),
                "split_by":$("#split_by").val(),
                "index":$("#index").val()
            },
            success: function(result) {
                if(result.successful) {
                    highlightMatchResult(result);
                } else {
                    showWarning(warningText);
                }
            },
            error: function() {
                showError(warningText);
            },
            complete: function() {
                button.html("Try!");
            }
        });
    });

    function highlightMatchResult(result) {
        var example = $("#xtrc-example");
        // Set to original content first, so we can do this multiple times.
        example.html($("#xtrc-original-example").html());

        var spanStart = "<span class='xtrc-hl'>";
        var spanEnd = "</span>";

        var start = result.match.start;
        var end = result.match.end+spanStart.length;

        var exampleContent = $("<div/>").html(example.html()).text(); // ZOMG JS. this is how you unescape HTML entities.

        example.html(exampleContent.splice(start,0,spanStart).splice(end,0,spanEnd));
    }

    // Add converter button.
    $("#add-converter-fields button").on("click", function() {
        var type = $("#add-converter").val();

        var converter = $(".xtrc-converter-" + type);

        converter.show();
        converter.find(':checkbox').attr("checked", "checked");
        return false;
    });

    // Only allow alphanum and underscores as target_field values. Messages in graylog2-server will just ignore others.
    $("#target_field").on("keyup", function(event){
        var str = $(this).val();
        if(str != "") {
            var regex = /^[A-Za-z0-9_]+$/;
            if (!regex.test(str)) {
                $(this).val(str.slice(0,-1));
                return false;
            }
        }
    });

    // Show extractor details.
    $(".extractor-show-details, .xtrc-exception-bubble").on("click", function() {
        var extractorId = $(this).attr("data-extractor-id");
        $(".extractor-details-" + extractorId).toggle();
    });

    // No condition type.
    $("#no-condition-type").on("click", function() {
        $("#condition-value-input").hide();
    });

    // String condition type.
    $("#string-condition-type").on("click", function() {
        var div = $("#condition-value-input");
        $(".try-xtrc-condition").hide();
        $("#try-xtrc-condition-result").hide();
        div.show();
        $("input", div).attr("placeholder", "");
        $("label", div).html("Field must include this string:");
    });

    // Regex condition type.
    $("#regex-condition-type").on("click", function() {
        var div = $("#condition-value-input");
        div.show();
        $("input", div).attr("placeholder", "^\d{3,}");
        $("label", div).html("Field must match this regular expression:");
        $(".try-xtrc-condition").show();
    });

    // Try regex conditions.
    $(".try-xtrc-condition").on("click", function() {
        var button = $(this);

        button.html("<i class='icon-refresh icon-spin'></i> Trying...");
        $.ajax({
            url: appPrefixed('/a/tools/regex_test'),
            data: {
                "string":$("#xtrc-example").text(),
                "regex":$("#condition_value").val()
            },
            success: function(matchResult) {
                var resultMsg = $("#try-xtrc-condition-result");
                resultMsg.removeClass("success-match");
                resultMsg.removeClass("fail-match");
                if(matchResult.finds) {
                    resultMsg.html("Matches! Extractor would run against this example.");
                    resultMsg.addClass("success-match");
                } else {
                    resultMsg.html("Does not match! Extractor would not run.");
                    resultMsg.addClass("fail-match");
                }

                resultMsg.show();
            },
            error: function() {
                showError("Could not try regular expression. Make sure that it is valid.");
            },
            complete: function() {
                button.html("Try!");
            }
        });
    });

    // Ordering
    $(".xtrc-list-drag").sortable({
        handle: ".xtrc-order-handle",
        axis: "y",
        opacity: 0.6,
        scroll: true,
        cursor: "move",
        tolerance: "intersect",
        containment: "parent",
        start: function(event, ui) {
            ui.item.toggleClass("xtrc-order-active");
        },
        stop: function(event, ui) {
            ui.item.toggleClass("xtrc-order-active");
        },
        update: function(event, ui) {
            var sorted = $(this).sortable("toArray");
            var inputPersistId = $(this).attr("data-input-persist-id");
            var body = {
                order: sorted
            }

            $.ajax({
                url: appPrefixed('/a/system/inputs/' + inputPersistId + '/extractors/order'),
                type: "POST",
                data: JSON.stringify(body),
                processData: false,
                contentType: 'application/json',
                success: function() {
                    showSuccess("Extractor positions updated.")
                },
                error: function() {
                    showError("Could not update extractor order. Please try again.");
                }
            });

        }
    });

    // Extractor export formatting.
    if($(".extractor-json").size() > 0) {
        var formatted = JSON.stringify(JSON.parse($(".extractor-json").val()), null, 2);
        $(".extractor-json").val(formatted);
    }

});