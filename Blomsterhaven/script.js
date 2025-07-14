$(document).ready(function() {
    // --- GAME STATE VARIABLES ---
    let money = 50;
    let selectedTool = ''; // 'seed', 'wateringCan', 'scissors'
    let selectedSeed = ''; // 'daisy', 'tulip'
    let flowerData = []; // Array to store the state of each plot

    // --- CONFIGURATION ---
    const initialPlotCount = 2;
    const maxPlots = 10;
    const plotCost = 50;
    const waterCost = 1;
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
    const sunCooldown = 20000; // 20 seconds
    const musicCooldown = 20000; // 20 seconds

    // --- INITIALIZATION ---
    initializeGarden();
    updateMoneyDisplay();
    updateButtonStates();

    /**
     * Initializes the garden plots and the flowerData array.
     */
    function initializeGarden() {
        for (let i = 0; i < initialPlotCount; i++) {
            addPlotData();
        }
    }

    /**
     * Adds a new plot to the flowerData array.
     */
    function addPlotData() {
        flowerData.push({
            id: flowerData.length,
            isOccupied: false,
            flowerType: null,
            growthStage: -1,
            waterLevel: 0,
            waterNeeded: 0
        });
    }

    /**
     * Updates the money display and button states.
     */
    function updateMoneyDisplay() {
        $('#money-display').text(`${money} KR`);
        updateButtonStates();
    }

    /**
     * Updates the enabled/disabled state of all buttons based on money.
     */
    function updateButtonStates() {
        // Seed packets
        $('.seed-packet').each(function() {
            const seedType = $(this).data('seed-type');
            const cost = seedCosts[seedType];
            $(this).prop('disabled', money < cost);
        });

        // Watering can
        $('#watering-can').prop('disabled', money < waterCost);

        // Buy plot button
        const buyPlotBtn = $('#buy-plot-btn');
        buyPlotBtn.prop('disabled', money < plotCost || flowerData.length >= maxPlots);
        if (flowerData.length >= maxPlots) {
            buyPlotBtn.hide();
        }
    }

    // --- EVENT HANDLERS ---

    /**
     * Handles clicking on a seed packet.
     */
    $('.seed-packet').on('click', function() {
        selectedSeed = $(this).data('seed-type');
        selectTool('seed', $(this));
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
     * Handles clicking the 'Buy Plot' button.
     */
    $('#buy-plot-btn').on('click', function() {
        if (money >= plotCost) {
            money -= plotCost;
            updateMoneyDisplay();
            const garden = $('#garden');
            garden.append('<div class="plot"></div>');
            addPlotData();
        }
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
        $('#music-btn').prop('disabled', true);
        startCooldown($(this), sunCooldown, () => {
            $('#music-btn').prop('disabled', false);
        });
        animateSun();

        $('.plot .flower').each(function() {
            const plotIndex = $(this).parent().index();
            advanceGrowth(plotIndex);
        });
    });

    /**
     * Handles the Music Box button click.
     */
    $('#music-btn').on('click', function() {
        $(this).prop('disabled', true);
        $('#sun-btn').prop('disabled', true);
        startCooldown($(this), musicCooldown, () => {
            $('#sun-btn').prop('disabled', false);
        });
        playMusic();

        $('.plot .flower').each(function() {
            const plotIndex = $(this).parent().index();
            advanceGrowth(plotIndex);
        });
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
            plot.waterLevel = 0;
            plot.waterNeeded = Math.floor(Math.random() * 4) + 3; // Random between 3 and 6

            plotElement.append('<div class="flower"></div>');
            renderFlower(plotElement, plotIndex);
            selectTool(''); // Deselect tool after use
        }
    }

    /**
     * Waters a flower, advancing its growth if enough water is given.
     * @param {jQuery} plotElement - The plot element containing the flower.
     * @param {number} plotIndex - The index of the plot.
     */
    function waterFlower(plotElement, plotIndex) {
        const plot = flowerData[plotIndex];
        const stages = growthStages[plot.flowerType];

        if (plot.growthStage < stages.length - 1) {
            if (money >= waterCost) {
                money -= waterCost;
                updateMoneyDisplay();
                plot.waterLevel++;
                showWaterParticles(plotElement);
                if (plot.waterLevel >= plot.waterNeeded) {
                    advanceGrowth(plotIndex);
                }
            }
        }
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
            plot.waterLevel = 0;
            plot.waterNeeded = Math.floor(Math.random() * 4) + 3; // New random for next stage
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
            plot.waterLevel = 0;
            plot.waterNeeded = 0;

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
        const feedback = $(`<div class="money-feedback">+${amount} KR</div>`);
        plotElement.append(feedback);
        feedback.on('animationend', function() {
            $(this).remove();
        });
    }

    /**
     * Shows water particles over a plot.
     * @param {jQuery} plotElement - The plot element to show particles over.
     */
    function showWaterParticles(plotElement) {
        for (let i = 0; i < 10; i++) {
            const particle = $('<div class="water-particle"></div>');
            const x = Math.random() * plotElement.width();
            const y = Math.random() * -20; // Start above the plot
            particle.css({ left: x, top: y });
            plotElement.append(particle);
            particle.on('animationend', function() {
                $(this).remove();
            });
        }
    }

    /**
     * Starts a cooldown timer on a button.
     * @param {jQuery} buttonElement - The button to start the cooldown on.
     * @param {number} duration - The cooldown duration in milliseconds.
     * @param {function} callback - A function to call when the cooldown finishes.
     */
    function startCooldown(buttonElement, duration, callback) {
        const timerElement = buttonElement.find('.cooldown-timer');
        let secondsLeft = duration / 1000;

        timerElement.text(secondsLeft).show();

        const interval = setInterval(() => {
            secondsLeft--;
            timerElement.text(secondsLeft);
            if (secondsLeft <= 0) {
                clearInterval(interval);
                timerElement.hide();
                buttonElement.prop('disabled', false);
                if (callback) {
                    callback();
                }
                if (buttonElement.attr('id') === 'music-btn') {
                    const musicPlayer = $('#music-player')[0];
                    musicPlayer.pause();
                    musicPlayer.currentTime = 0;
                }
            }
        }, 1000);
    }

    /**
     * Animates the sun rising and setting.
     */
    function animateSun() {
        const sun = $('#sun-animation-container');
        sun.addClass('rise');
        setTimeout(() => {
            sun.removeClass('rise').addClass('set');
        }, sunCooldown - 2000); // Start setting 2 seconds before cooldown ends
    }

    /**
     * Plays the music.
     */
    function playMusic() {
        const musicPlayer = $('#music-player')[0];
        musicPlayer.play();
    }
});