import { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StorageIcon from '@mui/icons-material/Storage';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArticleIcon from '@mui/icons-material/Article';
import axios from 'axios';

const endpointMapping = {
    'Notion': 'notion',
    'Airtable': 'airtable',
    'HubSpot': 'hubspot',
};

const getIconForType = (type) => {
    switch (type) {
        // HubSpot types
        case 'contact':
            return <PersonIcon color="primary" />;
        case 'company':
            return <BusinessIcon color="secondary" />;
        case 'deal':
            return <AttachMoneyIcon color="success" />;
        case 'object_type':
            return <FolderIcon color="action" />;
        // Airtable types
        case 'Base':
            return <StorageIcon color="primary" />;
        case 'Table':
            return <TableChartIcon color="secondary" />;
        // Notion types
        case 'database':
            return <StorageIcon color="info" />;
        case 'page':
            return <ArticleIcon color="warning" />;
        default:
            return <FolderIcon color="action" />;
    }
};

const getChipColor = (type) => {
    switch (type) {
        // HubSpot types
        case 'contact':
            return 'primary';
        case 'company':
            return 'secondary';
        case 'deal':
            return 'success';
        case 'object_type':
            return 'default';
        // Airtable types
        case 'Base':
            return 'primary';
        case 'Table':
            return 'secondary';
        // Notion types
        case 'database':
            return 'info';
        case 'page':
            return 'warning';
        default:
            return 'default';
    }
};

const DataCard = ({ item }) => {
    return (
        <Card sx={{ mb: 1, border: '1px solid #e0e0e0' }}>
            <CardContent sx={{ py: 1.5 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                        {getIconForType(item.type)}
                        <Typography variant="body2" fontWeight="medium">
                            {item.name || 'Unnamed Item'}
                        </Typography>
                    </Box>
                    <Chip 
                        label={item.type} 
                        size="small" 
                        color={getChipColor(item.type)}
                        variant="outlined"
                    />
                </Box>
                {item.id && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        ID: {item.id}
                    </Typography>
                )}
                {(item.creation_time || item.last_modified_time) && (
                    <Box display="flex" gap={2} sx={{ mt: 0.5 }}>
                        {item.creation_time && (
                            <Typography variant="caption" color="text.secondary">
                                Created: {new Date(item.creation_time).toLocaleDateString()}
                            </Typography>
                        )}
                        {item.last_modified_time && (
                            <Typography variant="caption" color="text.secondary">
                                Modified: {new Date(item.last_modified_time).toLocaleDateString()}
                            </Typography>
                        )}
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export const DataForm = ({ integrationType, credentials }) => {
    const [loadedData, setLoadedData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const endpoint = endpointMapping[integrationType];

    const handleLoad = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const formData = new FormData();
            formData.append('credentials', JSON.stringify(credentials));
            const response = await axios.post(`http://localhost:8000/integrations/${endpoint}/load`, formData);
            const data = response.data;
            setLoadedData(data);
        } catch (e) {
            setError(e?.response?.data?.detail || 'Failed to load data');
            setLoadedData(null);
        } finally {
            setIsLoading(false);
        }
    }

    const groupedData = loadedData ? loadedData.reduce((acc, item) => {
        // Handle HubSpot structure (object_type containers)
        if (item.type === 'object_type') {
            acc[item.name] = { container: item, items: [] };
        }
        // Handle Airtable structure (Base containers)
        else if (item.type === 'Base') {
            acc[item.name] = { container: item, items: [] };
        }
        return acc;
    }, {}) : {};

    // Group child items under their parents
    if (loadedData) {
        loadedData.forEach(item => {
            // Handle HubSpot children
            if (item.type !== 'object_type' && item.type !== 'Base' && item.parent_path_or_name) {
                if (groupedData[item.parent_path_or_name]) {
                    groupedData[item.parent_path_or_name].items.push(item);
                }
            }
        });
    }

    return (
        <Box display='flex' justifyContent='center' alignItems='center' flexDirection='column' width='100%' sx={{ maxWidth: 800, mx: 'auto' }}>
            <Box display='flex' flexDirection='row' gap={2} sx={{ mb: 3 }}>
                <Button
                    onClick={handleLoad}
                    variant='contained'
                    disabled={isLoading}
                    startIcon={isLoading ? <CircularProgress size={20} /> : null}
                    sx={{ minWidth: 140 }}
                >
                    {isLoading ? 'Loading...' : 'Load Data'}
                </Button>
                <Button
                    onClick={() => {
                        setLoadedData(null);
                        setError(null);
                    }}
                    variant='outlined'
                    disabled={isLoading}
                >
                    Clear Data
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                    {error}
                </Alert>
            )}

            {loadedData && loadedData.length > 0 && (
                <Box width='100%'>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        {integrationType} Data ({loadedData.length} items)
                    </Typography>
                    
                    {Object.entries(groupedData).map(([groupName, group]) => (
                        <Accordion key={groupName} sx={{ mb: 2 }}>
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{ 
                                    bgcolor: 'grey.50',
                                    '&:hover': { bgcolor: 'grey.100' }
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1}>
                                    {getIconForType(group.container.type)}
                                    <Typography variant="subtitle1" fontWeight="medium">
                                        {groupName}
                                    </Typography>
                                    <Chip 
                                        label={`${group.items.length} items`} 
                                        size="small" 
                                        color="primary" 
                                        variant="outlined" 
                                    />
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 2 }}>
                                {group.items.length > 0 ? (
                                    group.items.map((item, index) => (
                                        <DataCard key={`${item.id}-${index}`} item={item} />
                                    ))
                                ) : (
                                    <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                        No items in this category
                                    </Typography>
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            {loadedData && loadedData.length === 0 && (
                <Alert severity="info" sx={{ width: '100%' }}>
                    No data found in your {integrationType} account.
                </Alert>
            )}
        </Box>
    );
}
