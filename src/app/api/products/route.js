import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


// GET all products or search products
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: search }
      ];
    }
    
    if (category && category !== 'all') {
      where.category = { name: category };
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Add status field to each product
    const productsWithStatus = products.map(product => ({
      ...product,
      status: product.quantity === 0 ? 'Out of Stock' : 
              product.quantity < product.minStock ? 'Low Stock' : 'In Stock'
    }));

    return NextResponse.json(productsWithStatus);
  } catch (error) {
    console.error('Error fetching products:', error);
    // Return empty array on error to prevent frontend crashes
    return NextResponse.json([]);
  }
}

// POST - Create new product
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, categoryId, price, quantity, minStock, unitsPerBox, profitPerUnit, profitPerBox, description, barcode } = body;

    // Validate required fields
    if (!name || !price || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        category: categoryId ? { connect: { id: parseInt(categoryId) } } : undefined,
        price: parseFloat(price),
        quantity: parseInt(quantity),
        minStock: parseInt(minStock) || 10,
        unitsPerBox: parseInt(unitsPerBox) || 10,
        profitPerUnit: parseFloat(profitPerUnit) || 0,
        profitPerBox: parseFloat(profitPerBox) || 0,
        description,
        barcode
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, name, categoryId, price, quantity, minStock, unitsPerBox, profitPerUnit, profitPerBox, description, barcode } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        category: categoryId ? { connect: { id: parseInt(categoryId) } } : { disconnect: true },
        price: parseFloat(price),
        quantity: parseInt(quantity),
        minStock: parseInt(minStock),
        unitsPerBox: parseInt(unitsPerBox) || 10,
        profitPerUnit: parseFloat(profitPerUnit) || 0,
        profitPerBox: parseFloat(profitPerBox) || 0,
        description,
        barcode
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const productId = parseInt(id);

    // Check if product has any sales or returns
    const relatedSales = await prisma.saleItem.count({
      where: { productId: productId }
    });

    const relatedReturns = await prisma.returnItem.count({
      where: { productId: productId }
    });

    if (relatedSales > 0 || relatedReturns > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete product. This product has sales or return history. Consider setting quantity to 0 instead.' 
      }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Cannot delete product. This product is referenced in other records.' 
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}