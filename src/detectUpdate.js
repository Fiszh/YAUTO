let lastRunTimestamp = null;

console.log('Update detector hooked up!')

const checkForUpdate = async () => {
    try {
        const response = await fetch('https://api.github.com/repos/Fiszh/YAUTO/actions/runs?per_page=1');
        
        if (!response.ok) {
            throw new Error('Failed to fetch GitHub Actions data');
        }

        const data = await response.json();

        const latestRun = data.workflow_runs[0];

        if (lastRunTimestamp === null) {
            lastRunTimestamp = latestRun.updated_at;
            return;
        }

        if (latestRun && latestRun.status === 'completed' && latestRun.conclusion === 'success' && new Date(latestRun.updated_at) > new Date(lastRunTimestamp)) {
            lastRunTimestamp = latestRun.updated_at;

            window.location.reload();
        }
    } catch (error) {
        console.error('Error checking for update:', error);
    }
};

setInterval(checkForUpdate, 60000);

checkForUpdate();