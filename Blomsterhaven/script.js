$(document).ready(function() {
    // --- GAME STATE VARIABLES ---
    let money = 50;
    let selectedTool = ''; // 'seed', 'wateringCan', 'scissors'
    let selectedSeed = ''; // 'daisy', 'tulip'
    const flowerData = []; // Array to store the state of each plot

    // --- CONFIGURATION ---
    const plotCount = 8;
    const seedCosts = {
        daisy: 5,
        tulip: 10
    };
    const flowerValues = {
        daisy: 10,
        tulip: 20
    };
    const growthStages = {
        daisy: ['seed', 'sprout', 'bud', 'small-daisy', 'full-daisy'],
        tulip: ['seed', 'sprout', 'bud', 'small-tulip', 'full-tulip']
    };
    const sunCooldown = 30000; // 30 seconds
    const musicCooldown = 60000; // 60 seconds

    // --- INITIALIZATION ---
    initializeGarden();
    updateMoneyDisplay();

    /**
     * Initializes the garden plots and the flowerData array.
     */
    function initializeGarden() {
        const garden = $('#garden');
        for (let i = 0; i < plotCount; i++) {
            // The plots are already in the HTML, so we just initialize the data
            flowerData.push({
                id: i,
                isOccupied: false,
                flowerType: null,
                growthStage: -1
            });
        }
    }

    /**
     * Updates the money display in the UI.
     */
    function updateMoneyDisplay() {
        $('#money-display').text(`$${money}`);
    }

    // --- EVENT HANDLERS ---

    /**
     * Handles clicking on a seed packet.
     */
    $('.seed-packet').on('click', function() {
        selectedSeed = $(this).data('seed-type');
        const cost = seedCosts[selectedSeed];
        if (money >= cost) {
            selectTool('seed', $(this));
        } else {
            alert("You don't have enough money!");
        }
    });

    /**
     * Handles clicking on the watering can.
     */
    $('#watering-can').on('click', function() {
        selectTool('wateringCan', $(this));
    });

    /**
     * Handles clicking on the scissors.
     */
    $('#scissors').on('click', function() {
        selectTool('scissors', $(this));
    });

    /**
     * Handles clicking on a garden plot.
     */
    $('#garden').on('click', '.plot', function() {
        const plotIndex = $(this).index();
        const plot = flowerData[plotIndex];

        switch (selectedTool) {
            case 'seed':
                if (!plot.isOccupied) {
                    plantFlower($(this), plotIndex);
                }
                break;
            case 'wateringCan':
                if (plot.isOccupied) {
                    waterFlower($(this), plotIndex);
                }
                break;
            case 'scissors':
                if (plot.isOccupied) {
                    harvestFlower($(this), plotIndex);
                }
                break;
        }
    });

    /**
     * Handles the Sun button click.
     */
    $('#sun-btn').on('click', function() {
        $(this).prop('disabled', true);
        $('.plot .flower').each(function() {
            const plotIndex = $(this).parent().index();
            advanceGrowth(plotIndex);
        });
        setTimeout(() => $(this).prop('disabled', false), sunCooldown);
    });

    /**
     * Handles the Music Box button click.
     */
    $('#music-btn').on('click', function() {
        $(this).prop('disabled', true);
        $('.plot .flower').each(function() {
            const plotIndex = $(this).parent().index();
            advanceGrowth(plotIndex);
        });
        setTimeout(() => $(this).prop('disabled', false), musicCooldown);
    });


    // --- GAME LOGIC FUNCTIONS ---

    /**
     * Selects a tool and updates the UI.
     * @param {string} tool - The tool to select.
     * @param {jQuery} buttonElement - The button element that was clicked.
     */
    function selectTool(tool, buttonElement) {
        selectedTool = tool;
        $('.tool-btn').removeClass('selected');
        if (buttonElement) {
            buttonElement.addClass('selected');
        }
        updateCursor();
    }

    /**
     * Updates the cursor based on the selected tool.
     */
    function updateCursor() {
        $('body').removeClass('cursor-seed cursor-watering-can cursor-scissors');
        switch (selectedTool) {
            case 'seed':
                $('body').addClass('cursor-seed');
                break;
            case 'wateringCan':
                $('body').addClass('cursor-watering-can');
                break;
            case 'scissors':
                $('body').addClass('cursor-scissors');
                break;
        }
    }

    /**
     * Plants a flower in a plot.
     * @param {jQuery} plotElement - The plot element where the flower is planted.
     * @param {number} plotIndex - The index of the plot in the flowerData array.
     */
    function plantFlower(plotElement, plotIndex) {
        const cost = seedCosts[selectedSeed];
        if (money >= cost) {
            money -= cost;
            updateMoneyDisplay();

            const plot = flowerData[plotIndex];
            plot.isOccupied = true;
            plot.flowerType = selectedSeed;
            plot.growthStage = 0;

            plotElement.append('<div class="flower"></div>');
            renderFlower(plotElement, plotIndex);
        } else {
            alert("You don't have enough money!");
        }
    }

    /**
     * Waters a flower, advancing its growth.
     * @param {jQuery} plotElement - The plot element containing the flower.
     * @param {number} plotIndex - The index of the plot.
     */
    function waterFlower(plotElement, plotIndex) {
        advanceGrowth(plotIndex);
    }

    /**
     * Advances the growth of a flower.
     * @param {number} plotIndex - The index of the plot.
     */
    function advanceGrowth(plotIndex) {
        const plot = flowerData[plotIndex];
        const stages = growthStages[plot.flowerType];
        if (plot.growthStage < stages.length - 1) {
            plot.growthStage++;
            renderFlower($('.plot').eq(plotIndex), plotIndex);
        }
    }

    /**
     * Harvests a fully grown flower.
     * @param {jQuery} plotElement - The plot element.
     * @param {number} plotIndex - The index of the plot.
     */
    function harvestFlower(plotElement, plotIndex) {
        const plot = flowerData[plotIndex];
        const stages = growthStages[plot.flowerType];
        if (plot.growthStage === stages.length - 1) {
            const value = flowerValues[plot.flowerType];
            money += value;
            updateMoneyDisplay();
            showMoneyFeedback(plotElement, value);

            plot.isOccupied = false;
            plot.flowerType = null;
            plot.growthStage = -1;

            plotElement.find('.flower').fadeOut(500, function() {
                $(this).remove();
            });
        }
    }

    /**
     * Renders the flower's current growth stage.
     * @param {jQuery} plotElement - The plot element.
     * @param {number} plotIndex - The index of the plot.
     */
    function renderFlower(plotElement, plotIndex) {
        const plot = flowerData[plotIndex];
        const flower = plotElement.find('.flower');
        const stages = growthStages[plot.flowerType];
        const stageClass = stages[plot.growthStage];

        // Remove old classes and add the new one
        flower.attr('class', 'flower').addClass(stageClass);
    }

    /**
     * Shows floating text indicating money earned.
     * @param {jQuery} plotElement - The plot element where the harvest happened.
     * @param {number} amount - The amount of money earned.
     */
    function showMoneyFeedback(plotElement, amount) {
        const feedback = $(`<div class="money-feedback">+$${amount}</div>`);
        plotElement.append(feedback);
        feedback.on('animationend', function() {
            $(this).remove();
        });
    }
});