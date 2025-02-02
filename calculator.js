class BodyCalculator {
    constructor() {
        this.form = document.getElementById('measurementForm');
        this.resultsDiv = document.getElementById('results');
        this.unitSystem = document.getElementById('unitSystem');
        
        // Add debug check
        if (!this.resultsDiv) {
            console.error('Results div not found');
        }
        
        this.idealRatios = {
            male: {
                shoulderToWaist: 1.618,
                waistToHeight: 0.445,
                chestToWaist: null,
                bicepsToNeck: 1.0,
                calvesToNeck: 1.0
            },
            female: {
                waistToHips: 0.7,
                shoulderToHips: 1.0,
                bustToWaist: 1.25
            }
        };
        
        this.initializeEventListeners();

        // Add scroll indicator element
        this.scrollIndicator = document.createElement('div');
        this.scrollIndicator.className = 'scroll-indicator';
        this.scrollIndicator.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
        document.body.appendChild(this.scrollIndicator);
        
        // Hide scroll indicator initially
        this.scrollIndicator.style.display = 'none';
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateMeasurements();
        });

        this.unitSystem.addEventListener('change', () => {
            this.toggleUnitSystem();
        });
    }

    toggleUnitSystem() {
        const isImperial = this.unitSystem.value === 'imperial';
        const metricInputs = document.querySelectorAll('.metric-input');
        const imperialInputs = document.querySelectorAll('.imperial-input');
        const form = document.getElementById('measurementForm');

        // Add transition effect
        form.querySelectorAll('.input-group').forEach(group => {
            group.classList.add('fade-out');
        });

        setTimeout(() => {
            metricInputs.forEach(input => {
                input.classList.toggle('hidden', isImperial);
                input.querySelectorAll('input').forEach(i => {
                    i.required = !isImperial;
                    if (isImperial) {
                        i.value = ''; // Clear values when switching
                    }
                });
            });

            imperialInputs.forEach(input => {
                input.classList.toggle('hidden', !isImperial);
                input.querySelectorAll('input').forEach(i => {
                    i.required = isImperial;
                    if (!isImperial) {
                        i.value = ''; // Clear values when switching
                    }
                });
            });

            // Remove transition effect
            form.querySelectorAll('.input-group').forEach(group => {
                group.classList.remove('fade-out');
                group.classList.add('fade-in');
            });
        }, 300);

        // Remove fade-in class after animation
        setTimeout(() => {
            form.querySelectorAll('.input-group').forEach(group => {
                group.classList.remove('fade-in');
            });
        }, 600);
    }

    // Conversion helpers
    inchesToCm(inches) {
        return inches * 2.54;
    }

    lbsToKg(lbs) {
        return lbs * 0.453592;
    }

    ftInToCm(feet, inches) {
        const totalInches = (feet * 12) + (inches || 0);
        return this.inchesToCm(totalInches);
    }

    getMeasurements() {
        const isImperial = this.unitSystem.value === 'imperial';
        let measurements = {
            gender: document.getElementById('gender').value
        };

        if (isImperial) {
            const heightFt = parseFloat(document.getElementById('heightFt').value);
            const heightIn = parseFloat(document.getElementById('heightIn').value) || 0;
            measurements.height = this.ftInToCm(heightFt, heightIn);
            
            measurements.weight = this.lbsToKg(parseFloat(document.getElementById('weightLbs').value));
            measurements.neck = this.inchesToCm(parseFloat(document.getElementById('neckIn').value));
            measurements.shoulders = this.inchesToCm(parseFloat(document.getElementById('shouldersIn').value));
            measurements.chest = this.inchesToCm(parseFloat(document.getElementById('chestIn').value));
            measurements.waist = this.inchesToCm(parseFloat(document.getElementById('waistIn').value));
            measurements.hips = this.inchesToCm(parseFloat(document.getElementById('hipsIn').value));
            measurements.biceps = this.inchesToCm(parseFloat(document.getElementById('bicepsIn').value));
            measurements.calves = this.inchesToCm(parseFloat(document.getElementById('calvesIn').value));
        } else {
            measurements.height = parseFloat(document.getElementById('heightCm').value);
            measurements.weight = parseFloat(document.getElementById('weightKg').value);
            measurements.neck = parseFloat(document.getElementById('neckCm').value);
            measurements.shoulders = parseFloat(document.getElementById('shouldersCm').value);
            measurements.chest = parseFloat(document.getElementById('chestCm').value);
            measurements.waist = parseFloat(document.getElementById('waistCm').value);
            measurements.hips = parseFloat(document.getElementById('hipsCm').value);
            measurements.biceps = parseFloat(document.getElementById('bicepsCm').value);
            measurements.calves = parseFloat(document.getElementById('calvesCm').value);
        }

        return measurements;
    }

    calculateBMI(weight, height) {
        const heightInMeters = height / 100;
        return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }

    calculateRatios(measurements) {
        const { gender, shoulders, chest, waist, hips } = measurements;
        
        return {
            shoulderToWaist: shoulders / waist,
            waistToHips: waist / hips,
            chestToWaist: chest / waist
        };
    }

    calculateIdealWeight(height, gender) {
        // Using BMI formula: weight = BMI * (height in m)²
        // Target BMI of 22 (middle of healthy range 18.5-25)
        const heightInMeters = height / 100;
        const targetBMI = 22;
        
        return targetBMI * (heightInMeters * heightInMeters); // Returns weight in kg
    }

    calculateIdealMeasurements(height, gender, neck) {
        const heightInInches = height / 2.54;
        const idealWaistInches = heightInInches * 0.445;
        
        let ideals = {
            waist: idealWaistInches * 2.54,
            shoulders: null,
            chest: null,
            biceps: null,
            calves: null,
            weight: this.calculateIdealWeight(height, gender)
        };

        if (gender === 'male') {
            ideals.shoulders = (idealWaistInches * 1.618) * 2.54;
            ideals.chest = ((idealWaistInches + 11) * 2.54);
            ideals.biceps = neck;
            ideals.calves = neck;
        }

        return ideals;
    }

    generateRecommendations(measurements, ratios) {
        const recommendations = [];
        const { gender, height, waist, biceps, calves, neck, weight } = measurements;
        const ideals = this.calculateIdealMeasurements(height, gender, neck);
        const isImperial = this.unitSystem.value === 'imperial';

        const formatMeasurement = (value) => {
            if (isImperial) {
                return `${(value/2.54).toFixed(1)}"`;
            }
            return `${value.toFixed(1)} cm`;
        };

        const formatWeight = (value) => {
            if (isImperial) {
                return `${(value/0.453592).toFixed(1)} lbs`;
            }
            return `${value.toFixed(1)} kg`;
        };

        // Weight-based recommendations
        const weightDiff = weight - ideals.weight;
        const weightDiffAbs = Math.abs(weightDiff);
        
        if (weightDiffAbs > 2) { // If more than 2kg difference
            if (weightDiff > 0) {
                recommendations.push(`Your weight is ${formatWeight(weightDiffAbs)} above ideal:`);
                recommendations.push("- Consider a moderate caloric deficit");
                recommendations.push("- Increase protein intake to preserve muscle");
                recommendations.push("- Add regular cardiovascular exercise");
            } else {
                recommendations.push(`Your weight is ${formatWeight(weightDiffAbs)} below ideal:`);
                recommendations.push("- Consider a caloric surplus with clean foods");
                recommendations.push("- Focus on protein-rich meals");
                recommendations.push("- Prioritize strength training");
            }
        }

        // BMI-based recommendations
        const bmi = this.calculateBMI(measurements.weight, measurements.height);
        if (bmi < 18.5) {
            recommendations.push("BMI indicates underweight status:");
            recommendations.push("- Gradually increase daily caloric intake");
            recommendations.push("- Add nutrient-dense foods to diet");
        } else if (bmi > 25) {
            recommendations.push("BMI indicates overweight status:");
            recommendations.push("- Create a sustainable caloric deficit");
            recommendations.push("- Incorporate regular cardio sessions");
        }

        // Gender-specific recommendations with new ideal proportions
        if (gender === 'male') {
            const waistDiff = Math.abs(waist - ideals.waist);
            const shoulderDiff = Math.abs(measurements.shoulders - ideals.shoulders);
            const chestDiff = Math.abs(measurements.chest - ideals.chest);

            // Waist recommendations
            if (waist > ideals.waist + 5) {
                recommendations.push(`Your waist is ${formatMeasurement(waistDiff)} larger than ideal:`);
                recommendations.push("- Focus on core exercises and fat loss");
                recommendations.push("- Consider adding HIIT workouts");
            } else if (waist < ideals.waist - 5) {
                recommendations.push(`Your waist is ${formatMeasurement(waistDiff)} smaller than ideal:`);
                recommendations.push("- Consider adding core muscle mass");
                recommendations.push("- Focus on compound exercises");
            }

            // Shoulder recommendations
            if (measurements.shoulders < ideals.shoulders - 5) {
                recommendations.push(`Your shoulders are ${formatMeasurement(shoulderDiff)} smaller than ideal:`);
                recommendations.push("- Focus on lateral deltoid development");
                recommendations.push("- Include overhead presses and lateral raises");
                recommendations.push("- Add pull-ups and rowing exercises");
            }

            // Chest recommendations
            if (measurements.chest < ideals.chest - 5) {
                recommendations.push(`Your chest is ${formatMeasurement(chestDiff)} smaller than ideal:`);
                recommendations.push("- Focus on chest development");
                recommendations.push("- Include bench press and push-ups");
                recommendations.push("- Add dumbbell flyes for width");
            }

            // Biceps recommendations
            if (Math.abs(biceps - neck) > 2) {
                const bicepsDiff = Math.abs(biceps - neck);
                if (biceps < neck) {
                    recommendations.push(`Your biceps are ${formatMeasurement(bicepsDiff)} smaller than your neck:`);
                    recommendations.push("- Focus on bicep development");
                    recommendations.push("- Include various curl exercises");
                    recommendations.push("- Add progressive overload to arm workouts");
                }
            }

            // Calves recommendations
            if (Math.abs(calves - neck) > 2) {
                const calvesDiff = Math.abs(calves - neck);
                if (calves < neck) {
                    recommendations.push(`Your calves are ${formatMeasurement(calvesDiff)} smaller than your neck:`);
                    recommendations.push("- Add dedicated calf training");
                    recommendations.push("- Include both seated and standing calf raises");
                    recommendations.push("- Consider adding jump rope to your routine");
                }
            }
        } else {
            if (ratios.waistToHips > this.idealRatios.female.waistToHips) {
                recommendations.push("Focus on waist-to-hip ratio improvement:");
                recommendations.push("- Include hip-focused exercises like hip thrusts");
                recommendations.push("- Add core-strengthening exercises");
            }
        }

        return recommendations;
    }

    calculateMeasurements() {
        const measurements = this.getMeasurements();
        const bmi = this.calculateBMI(measurements.weight, measurements.height);
        const ratios = this.calculateRatios(measurements);
        const recommendations = this.generateRecommendations(measurements, ratios);

        this.displayResults(measurements, bmi, ratios, recommendations);

        // Make results visible
        this.resultsDiv.style.display = 'block';
        this.resultsDiv.classList.add('visible');

        // Show scroll indicator
        this.scrollIndicator.style.display = 'block';
        setTimeout(() => {
            this.scrollIndicator.classList.add('visible');
        }, 100);

        // Scroll to results
        this.resultsDiv.scrollIntoView({ behavior: 'smooth' });

        // Hide scroll indicator after scrolling
        setTimeout(() => {
            this.scrollIndicator.classList.remove('visible');
            setTimeout(() => {
                this.scrollIndicator.style.display = 'none';
            }, 300);
        }, 2000);
    }

    displayResults(measurements, bmi, ratios, recommendations) {
        const bmiResult = document.getElementById('bmiResult');
        const ratioAnalysis = document.getElementById('ratioAnalysis');
        const recommendationsDiv = document.getElementById('recommendations');
        const isImperial = this.unitSystem.value === 'imperial';
        const ideals = this.calculateIdealMeasurements(measurements.height, measurements.gender, measurements.neck);

        // Display BMI and Weight Analysis
        bmiResult.innerHTML = `
            <h3>Body Composition Analysis</h3>
            <p>Your BMI: ${bmi}</p>
            <p>Category: ${this.getBMICategory(bmi)}</p>
            <div class="measurement-group">
                <p>Weight Analysis:</p>
                <ul>
                    <li>Current: ${isImperial ? 
                        `${(measurements.weight/0.453592).toFixed(1)} lbs` : 
                        `${measurements.weight.toFixed(1)} kg`}</li>
                    <li>Ideal: ${isImperial ? 
                        `${(ideals.weight/0.453592).toFixed(1)} lbs` : 
                        `${ideals.weight.toFixed(1)} kg`}</li>
                    <li>Difference: ${isImperial ? 
                        `${(Math.abs(measurements.weight - ideals.weight)/0.453592).toFixed(1)} lbs` : 
                        `${Math.abs(measurements.weight - ideals.weight).toFixed(1)} kg`}
                        ${measurements.weight > ideals.weight ? 'above' : 'below'} ideal</li>
                </ul>
            </div>
            <p>Height: ${isImperial ? 
                `${Math.floor(measurements.height/30.48)}' ${Math.round(measurements.height/2.54 % 12)}"` : 
                `${measurements.height.toFixed(1)} cm`}</p>
        `;

        // Display Ratios and Ideals
        let ratioContent = `<h3>Body Measurements Analysis</h3>`;
        
        if (measurements.gender === 'male') {
            const displayMeasurement = (actual, ideal, name) => {
                if (!ideal && ideal !== 0) return '';
                const diff = actual - ideal;
                const diffText = diff > 0 ? 'larger' : 'smaller';
                const diffValue = Math.abs(diff);
                const diffFormatted = isImperial ? 
                    `${(diffValue/2.54).toFixed(1)}"` : 
                    `${diffValue.toFixed(1)} cm`;
                
                return `
                    <div class="measurement-group">
                        <p>${name}:</p>
                        <ul>
                            <li>Current: ${isImperial ? (actual/2.54).toFixed(1) + '"' : actual.toFixed(1) + ' cm'}</li>
                            <li>Ideal: ${isImperial ? (ideal/2.54).toFixed(1) + '"' : ideal.toFixed(1) + ' cm'}</li>
                            <li>Difference: ${diffFormatted} ${diffText}</li>
                        </ul>
                    </div>
                `;
            };

            ratioContent += `
                ${displayMeasurement(measurements.neck, measurements.neck, 'Neck (Reference)')}
                ${displayMeasurement(measurements.waist, ideals.waist, 'Waist')}
                ${displayMeasurement(measurements.shoulders, ideals.shoulders, 'Shoulders')}
                ${displayMeasurement(measurements.chest, ideals.chest, 'Chest')}
                ${displayMeasurement(measurements.biceps, measurements.neck, 'Biceps')}
                ${displayMeasurement(measurements.calves, measurements.neck, 'Calves')}
            `;
        } else {
            ratioContent += `
                <div class="measurement-group">
                    <p>Waist to Hips Ratio: ${ratios.waistToHips.toFixed(2)}</p>
                    <p>Target Ratio: ${this.idealRatios.female.waistToHips}</p>
                </div>
            `;
        }

        ratioAnalysis.innerHTML = ratioContent;

        // Format recommendations with grouping
        const formatRecommendations = (recs) => {
            let formattedRecs = [];
            let currentGroup = [];
            
            recs.forEach(rec => {
                if (rec.startsWith('-')) {
                    currentGroup.push(rec);
                } else {
                    if (currentGroup.length > 0) {
                        formattedRecs.push(currentGroup);
                        currentGroup = [];
                    }
                    currentGroup = [rec];
                }
            });
            
            if (currentGroup.length > 0) {
                formattedRecs.push(currentGroup);
            }

            return formattedRecs.map(group => `
                <div class="recommendation-group">
                    <div class="recommendation-header">${group[0]}</div>
                    ${group.slice(1).length > 0 ? `
                        <div class="recommendation-details">
                            ${group.slice(1).map(detail => `<p>${detail}</p>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        };

        // Display Recommendations
        recommendationsDiv.innerHTML = `
            <h3>Recommendations</h3>
            ${formatRecommendations(recommendations)}
        `;

        this.resultsDiv.classList.remove('hidden');
    }

    getBMICategory(bmi) {
        if (bmi < 18.5) return "Underweight";
        if (bmi < 25) return "Normal weight";
        if (bmi < 30) return "Overweight";
        return "Obese";
    }
}

// Initialize the calculator
document.addEventListener('DOMContentLoaded', () => {
    new BodyCalculator();
}); 